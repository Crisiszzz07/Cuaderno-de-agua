import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import type { LiveActivity } from '../src/application/live-activity.ts';
import { LiveActivityError } from '../src/application/live-activity.ts';

const POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'";
const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
async function readJson(request: IncomingMessage): Promise<unknown> {
  if (!request.headers['content-type']?.startsWith('application/json')) throw new LiveActivityError(415, 'Se requiere contenido JSON.');
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > 4096) throw new LiveActivityError(413, 'La solicitud supera el tamaño permitido.');
    chunks.push(bytes);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new LiveActivityError(400, 'Contenido JSON no válido.'); }
}
function credential(request: IncomingMessage) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new LiveActivityError(403, 'Esta solicitud necesita el acceso temporal de la sesión.');
  return header.slice(7);
}
function json(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}

export function createLiveHandler(activity: LiveActivity, directory: string, publicOrigin?: string) {
  if (publicOrigin) {
    const configured = new URL(publicOrigin);
    if (configured.protocol !== 'https:' || configured.origin !== publicOrigin) throw new Error('PUBLIC_ORIGIN debe ser un origen HTTPS sin ruta ni barra final.');
  }
  const root = resolve(directory);
  return async (request: IncomingMessage, response: ServerResponse) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', POLICY);
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    try {
      const url = new URL(request.url ?? '/', 'http://internal.invalid');
      const path = url.pathname;
      const method = request.method ?? 'GET';
      if (path.startsWith('/api/live')) {
        if (method !== 'GET') {
          const origin = request.headers.origin;
          if (publicOrigin && (origin !== publicOrigin || request.headers.host !== new URL(publicOrigin).host)) throw new LiveActivityError(403, 'La solicitud debe venir del sitio público configurado.');
          if (origin && new URL(origin).host !== request.headers.host) throw new LiveActivityError(403, 'La solicitud debe venir del mismo sitio.');
        }
        if (path === '/api/live/health' && method === 'GET') { json(response, 200, { available: true, persistence: 'memory', durationSeconds: 180 }); return; }
        if (path === '/api/live/sessions' && method === 'POST') {
          const value = await readJson(request);
          if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length) throw new LiveActivityError(400, 'No envíes información adicional al crear la sesión.');
          json(response, 201, activity.create()); return;
        }
        const match = path.match(/^\/api\/live\/sessions\/([A-F0-9]{8})(?:\/(join|answers))?$/);
        if (!match) throw new LiveActivityError(404, 'Esta ruta de actividad no existe.');
        const [, code, action] = match;
        if (!action && method === 'GET') { json(response, 200, activity.snapshot(code, request.headers.authorization ? credential(request) : undefined)); return; }
        if (!action && method === 'DELETE') { activity.end(code, credential(request)); json(response, 200, { ended: true }); return; }
        if (action === 'join' && method === 'POST') {
          const value = await readJson(request);
          if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length) throw new LiveActivityError(400, 'La participación no requiere datos personales.');
          json(response, 201, activity.join(code)); return;
        }
        if (action === 'answers' && method === 'POST') { json(response, 200, activity.submit(code, credential(request), await readJson(request))); return; }
        throw new LiveActivityError(405, 'Método no permitido.');
      }
      if (method !== 'GET' && method !== 'HEAD') throw new LiveActivityError(405, 'Método no permitido.');
      const decoded = decodeURIComponent(path);
      if (decoded.includes('\0')) throw new LiveActivityError(400, 'Ruta no válida.');
      let file = resolve(root, `.${decoded}`);
      if (!file.startsWith(`${root}${sep}`) && file !== root) throw new LiveActivityError(404, 'Archivo no encontrado.');
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      const actual = await realpath(file);
      if (!actual.startsWith(`${root}${sep}`)) throw new LiveActivityError(404, 'Archivo no encontrado.');
      const bytes = await readFile(actual);
      response.writeHead(200, { 'Content-Type': MIME[extname(actual)] ?? 'application/octet-stream', 'Content-Length': bytes.length, 'Cache-Control': extname(actual) === '.html' ? 'no-cache' : 'public, max-age=3600' });
      response.end(method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      if (response.headersSent) { response.end(); return; }
      if (error instanceof LiveActivityError) json(response, error.status, { error: error.message });
      else if (error instanceof URIError || error instanceof TypeError) json(response, 400, { error: 'Solicitud no válida.' });
      else if (error && typeof error === 'object' && 'code' in error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) json(response, 404, { error: 'Archivo no encontrado.' });
      else json(response, 500, { error: 'No se pudo completar la solicitud.' });
    }
  };
}
