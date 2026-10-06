import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';
import { convertToTSX, transform } from '@astrojs/compiler';
import { sourceFiles } from './files.ts';

// Verify Astro templates and typed props without leaving generated files in src/.
const files = (await sourceFiles('src')).filter(file => file.endsWith('.astro'));
const virtualFiles = new Map<string, string>();
let compilerErrors = 0;
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const compiled = await transform(source, { filename: file });
  for (const diagnostic of compiled.diagnostics.filter(item => item.severity === 1)) {
    console.error(`${file}:${diagnostic.location.line}: ${diagnostic.text}`);
    compilerErrors++;
  }
  const result = await convertToTSX(source, { filename: file, includeScripts: false, includeStyles: false });
  const code = result.code.replace(/(['"])([^'"]+\.astro)\1/g, '$1$2.tsx$1');
  virtualFiles.set(resolve(`${file}.tsx`), `${code}\ndeclare const Fragment: (props: { children?: unknown }) => unknown;\n`);
}
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
const options = { ...parsed.options, jsx: ts.JsxEmit.Preserve, noUnusedLocals: false, noUnusedParameters: false };
const host = ts.createCompilerHost(options);
const read = host.readFile.bind(host);
const exists = host.fileExists.bind(host);
host.readFile = file => virtualFiles.get(resolve(file)) ?? read(file);
host.fileExists = file => virtualFiles.has(resolve(file)) || exists(file);
host.getSourceFile = (file, languageVersion) => {
  const code = host.readFile(file);
  return code === undefined ? undefined : ts.createSourceFile(file, code, languageVersion, true);
};
const program = ts.createProgram([...virtualFiles.keys()], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
const formatHost = { getCanonicalFileName: (file: string) => file, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n' };
if (diagnostics.length) console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost));
if (compilerErrors || diagnostics.length) process.exitCode = 1;
else console.log(`Astro: ${files.length} plantillas y sus props comprobadas con el compilador y TypeScript.`);
