import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { LiveActivity } from '../src/application/live-activity.ts';
import { MemoryLiveStore } from '../src/infrastructure/memory-live-store.ts';
import { liveQuestions } from '../src/infrastructure/live-questions.ts';
import { createLiveHandler } from './live-http.ts';
import { loadPrivateCover } from './private-cover.ts';

const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? '0.0.0.0';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un puerto válido.');
const epoch = Date.now();
const started = performance.now();
const clock = () => epoch + performance.now() - started;
const activity = new LiveActivity(new MemoryLiveStore(), liveQuestions, clock, () => randomBytes(24).toString('hex'));
if (process.env.PRIVATE_COVER_FILE && !process.env.PUBLIC_ORIGIN) throw new Error('La portada privada requiere PUBLIC_ORIGIN con HTTPS.');
const privateCover = await loadPrivateCover(process.env.PRIVATE_COVER_FILE);
const server = createServer(createLiveHandler(activity, 'dist', process.env.PUBLIC_ORIGIN, privateCover));
server.requestTimeout = 10_000;
server.headersTimeout = 10_000;
const cleanup = setInterval(() => activity.purge(), 1000);
cleanup.unref();
server.on('error', (error: NodeJS.ErrnoException) => {
  clearInterval(cleanup);
  console.error(`No se pudo escuchar en ${host}:${port} (${error.code ?? 'error desconocido'}).`);
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto está ocupado. Prueba otro: PORT=${port === 8081 ? 8082 : 8081} pnpm serve:live`);
  } else if (error.code === 'EPERM' || error.code === 'EACCES') {
    console.error('El entorno denegó el permiso para abrir el servidor. Ejecuta pnpm serve:live en una terminal con permiso para escuchar conexiones; cambiar de puerto puede no resolver esta restricción.');
  } else if (error.code === 'EADDRNOTAVAIL') {
    console.error('HOST no corresponde a una dirección disponible. Para uso local prueba HOST=127.0.0.1 pnpm serve:live');
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});
server.listen(port, host, () => console.log(`Cuaderno y actividad efímera disponibles en http://${host.includes(':') ? `[${host}]` : host}:${port}. Sin registros de acceso.`));
process.on('SIGTERM', () => { clearInterval(cleanup); server.close(); });
process.on('SIGINT', () => { clearInterval(cleanup); server.close(); });
