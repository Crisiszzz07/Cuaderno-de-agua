import { readFile, stat } from 'node:fs/promises';
import { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PrivateCoverConfig, CoverAuthorship } from '../src/domain/private-cover.ts';
import { LiveActivityError } from '../src/application/live-activity.ts';

const derive = promisify(scrypt);
export function parsePrivateCover(value: unknown): PrivateCoverConfig {
  if (!value || typeof value !== 'object') throw new Error('Configuración privada de portada no válida.');
  const config = value as Partial<PrivateCoverConfig>;
  const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 120;
  if (!/^[a-f0-9]{32}$/.test(config.salt ?? '') || !/^[a-f0-9]{128}$/.test(config.hash ?? '') || !config.authorship ||
    !text(config.authorship.institution) || !text(config.authorship.semester) || !Array.isArray(config.authorship.authors) ||
    config.authorship.authors.length < 1 || config.authorship.authors.length > 8 || !config.authorship.authors.every(text)) {
    throw new Error('Configuración privada de portada no válida.');
  }
  return { salt: config.salt!, hash: config.hash!, authorship: {
    institution: config.authorship.institution,
    semester: config.authorship.semester,
    authors: [...config.authorship.authors],
  } };
}

export class PrivateCover {
  private attempts = 0;
  private windowStart: number | undefined;
  private readonly config: PrivateCoverConfig;
  private readonly clock: () => number;
  constructor(config: PrivateCoverConfig, clock: () => number = () => performance.now()) {
    this.config = parsePrivateCover(config);
    this.clock = clock;
  }
  async authorize(body: unknown): Promise<CoverAuthorship> {
    const now = this.clock();
    if (this.windowStart === undefined || now - this.windowStart >= 60_000) { this.windowStart = now; this.attempts = 0; }
    if (this.attempts >= 5) throw new LiveActivityError(429, 'Espera un minuto antes de volver a intentar.');
    this.attempts++;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !('code' in body) || typeof body.code !== 'string' || body.code.length < 6 || body.code.length > 128) {
      throw new LiveActivityError(400, 'Introduce un código válido.');
    }
    const actual = await derive(body.code, this.config.salt, 64) as Buffer;
    if (!timingSafeEqual(actual, Buffer.from(this.config.hash, 'hex'))) throw new LiveActivityError(403, 'El código no permite acceder a esta portada.');
    return structuredClone(this.config.authorship);
  }
}

export async function loadPrivateCover(file: string | undefined): Promise<PrivateCover | undefined> {
  if (!file) return undefined;
  try {
    if ((await stat(file)).size > 8192) throw new Error('Configuración demasiado grande.');
    return new PrivateCover(parsePrivateCover(JSON.parse(await readFile(file, 'utf8'))));
  } catch {
    throw new Error('No se pudo cargar la configuración privada de portada. Revisa el montaje y su formato sin publicar el contenido.');
  }
}
