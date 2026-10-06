import { mkdir, writeFile } from 'node:fs/promises';
import { preparePresentation } from '../src/application/prepare-presentation.ts';
import { getReferences } from '../src/application/get-content.ts';
import { createPresentationPptx } from '../src/infrastructure/export/pptx.ts';

const slides = preparePresentation();
await mkdir('public/downloads', { recursive: true });
await writeFile('public/downloads/ecosistemas-foticos.pptx', createPresentationPptx(slides, getReferences()));
console.log(`PPTX estático: ${slides.length} diapositivas editables, fuentes y enlaces públicos.`);
