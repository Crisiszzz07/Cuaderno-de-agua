import { createInterface, emitKeypressEvents } from 'node:readline';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes, scryptSync } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import type { PrivateCoverConfig } from '../src/domain/private-cover.ts';

async function secretInput(): Promise<string> {
  if (!process.stdin.isTTY) throw new Error('El código se introduce en una terminal interactiva, no como argumento.');
  process.stdout.write('Código de acceso (oculto): ');
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((accept, reject) => {
    let value = '';
    function finish() {
      process.stdin.removeListener('keypress', keypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
    }
    function keypress(text: string | undefined, key: { name?: string; ctrl?: boolean }) {
      if (key.ctrl && key.name === 'c') { finish(); reject(new Error('Cancelado.')); }
      else if (key.name === 'return') { finish(); accept(value); }
      else if (key.name === 'backspace') value = value.slice(0, -1);
      else if (text && !key.ctrl && /^[\x20-\x7e]+$/.test(text)) value += text;
    }
    process.stdin.on('keypress', keypress);
  });
}
const code = await secretInput();
if (code.length < 6 || code.length > 128) throw new Error('El código debe tener entre 6 y 128 caracteres.');
const terminal = createInterface({ input: process.stdin, output: process.stdout });
const question = (prompt: string) => new Promise<string>(accept => terminal.question(prompt, accept));
try {
  const authors = (await question('Nombres de integrantes, separados por coma: ')).split(',').map(name => name.trim()).filter(Boolean);
  const institution = (await question('Universidad: ')).trim();
  const semester = (await question('Semestre: ')).trim();
  if (!institution || !semester || authors.length < 1 || authors.length > 8 || [...authors, institution, semester].some(text => text.length > 120)) throw new Error('Datos de portada no válidos.');
  const salt = randomBytes(16).toString('hex');
  const config: PrivateCoverConfig = { salt, hash: scryptSync(code, salt, 64).toString('hex'), authorship: { authors, institution, semester } };
  const file = resolve('.local/private-cover.json');
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  await writeFile(file, JSON.stringify(config), { mode: 0o600, flag: 'wx' });
  console.log('Configuración creada en .local/private-cover.json. El código no se guarda en texto plano.');
} finally { terminal.close(); }
