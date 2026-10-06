import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { parse } from '@astrojs/compiler';
import { sourceFiles } from './files.ts';

// Small, explicit project rules: no framework lint dependency or opaque defaults.
const files = [...await sourceFiles('src'), ...await sourceFiles('server'), ...await sourceFiles('scripts'), ...await sourceFiles('tests')];
const errors: string[] = [];
for (const file of files) {
  const source = await readFile(file, 'utf8');
  if (/\.(?:m?js|jsx)$/.test(file)) errors.push(`${file}: usar TypeScript`);
  if (file.startsWith('src/') && /\b(?:eval\s*\(|innerHTML\s*=|localStorage\.|sessionStorage\.)/.test(source)) errors.push(`${file}: ejecución o almacenamiento innecesario`);
  if (/[ \t]+$/m.test(source)) errors.push(`${file}: espacios al final de línea`);
  if (file.endsWith('.astro')) {
    const result = await parse(source, { position: true });
    if (result.diagnostics.some(diagnostic => diagnostic.severity === 1)) errors.push(`${file}: sintaxis Astro inválida`);
  }
  if (file.endsWith('.ts')) {
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      if (node.kind === ts.SyntaxKind.AnyKeyword) errors.push(`${file}: evitar any explícito`);
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const dependency = node.moduleSpecifier.text;
        if (file.startsWith('src/domain/') && !dependency.includes('/domain/') && !dependency.startsWith('./')) errors.push(`${file}: el dominio debe ser independiente`);
        if (file.startsWith('src/application/') && dependency.includes('/ui/')) errors.push(`${file}: aplicación no debe importar interfaz`);
        if (file.startsWith('src/infrastructure/') && dependency.includes('/ui/')) errors.push(`${file}: datos no deben importar interfaz`);
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Lint: ${files.length} archivos; sintaxis, TypeScript y límites de arquitectura correctos.`);
