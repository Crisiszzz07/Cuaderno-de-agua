export async function checkDeployment(target: URL) {
  if (target.protocol !== 'https:' || target.pathname !== '/' || target.search || target.hash || target.username || target.password) {
    throw new Error('Indica únicamente el origen HTTPS público, sin credenciales ni ruta.');
  }
  for (const path of ['/', '/exposicion/', '/participar/', '/api/live/health', '/downloads/ecosistemas-foticos.pptx']) {
    const response = await fetch(new URL(path, target), { signal: AbortSignal.timeout(10_000), redirect: 'error' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    if (response.headers.get('x-content-type-options') !== 'nosniff') throw new Error(`${path}: falta nosniff`);
    if (response.headers.get('referrer-policy') !== 'no-referrer') throw new Error(`${path}: falta protección del referente`);
    if (!response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'")) throw new Error(`${path}: falta CSP`);
    if (!/max-age=[1-9][0-9]*/.test(response.headers.get('strict-transport-security') ?? '')) throw new Error(`${path}: falta HSTS`);
    if (response.headers.has('set-cookie')) throw new Error(`${path}: no se esperan cookies`);
    if (path === '/api/live/health') {
      const health = await response.json() as { available?: boolean; persistence?: string; durationSeconds?: number };
      if (!health.available || health.persistence !== 'memory' || health.durationSeconds !== 180) throw new Error('El servicio de actividad no corresponde al esperado.');
      if (response.headers.get('cache-control') !== 'no-store') throw new Error('La API debe excluir caché.');
    } else await response.arrayBuffer();
    console.log(`Correcto: ${path}`);
  }
  const insecure = new URL(target);
  insecure.protocol = 'http:';
  const redirect = await fetch(insecure, { redirect: 'manual', signal: AbortSignal.timeout(10_000) });
  if (![301, 308].includes(redirect.status) || redirect.headers.get('location') !== target.href) throw new Error('HTTP debe redirigir al origen HTTPS.');
  console.log('HTTPS, redirección, recursos y API comprobados. Falta ensayar una sesión real con teléfonos.');
}
if (import.meta.main) {
  const address = process.argv.slice(2).find(argument => argument !== '--');
  if (!address) {
    console.error('Uso: pnpm check:deployment -- https://example.org');
    process.exitCode = 1;
  } else await checkDeployment(new URL(address)).catch((error: unknown) => {
    console.error(`Despliegue no validado: ${error instanceof Error ? error.message : 'error de conexión'}`);
    process.exitCode = 1;
  });
}
