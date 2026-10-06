import type { Citation, PresentationSlide } from '../../domain/models.ts';
import { createZip } from './zip.ts';

const P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const xml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const documentXml = (body: string) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${body}`;
const emu = (inches: number) => Math.round(inches * 914400);
const color = { ink: '173E46', paper: 'F8F5EB', water: 'B6D7D0', deep: '315F6C', sand: 'E4D7B5' };
interface Paragraph { text: string; size?: number; bold?: boolean; italic?: boolean; link?: string; color?: string }

function textBox(id: number, name: string, x: number, y: number, width: number, height: number, paragraphs: readonly Paragraph[], fill?: string, inline = false): string {
  const content = paragraphs.map(paragraph => {
    const runs = paragraph.text.split(/(Acropora (?:palmata|cervicornis))/g).filter(Boolean).map(text => `<a:r><a:rPr lang="es-CO" sz="${(paragraph.size ?? 18) * 100}" b="${paragraph.bold ? 1 : 0}" i="${paragraph.italic || /^Acropora (palmata|cervicornis)$/.test(text) ? 1 : 0}"><a:solidFill><a:srgbClr val="${paragraph.color ?? color.ink}"/></a:solidFill><a:latin typeface="Calibri"/>${paragraph.link ? `<a:hlinkClick r:id="${paragraph.link}"/>` : ''}</a:rPr><a:t>${xml(text)}</a:t></a:r>`).join('');
    if (inline) return runs;
    return `<a:p><a:pPr><a:lnSpc><a:spcPct val="110000"/></a:lnSpc><a:spcAft><a:spcPts val="400"/></a:spcAft></a:pPr>${runs}<a:endParaRPr lang="es-CO"/></a:p>`;
  }).join('');
  const body = inline ? `<a:p>${content}<a:endParaRPr lang="es-CO"/></a:p>` : content || '<a:p/>';
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${xml(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(width)}" cy="${emu(height)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${fill ? `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>` : '<a:noFill/>'}<a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="${emu(.08)}" rIns="${emu(.08)}" tIns="${emu(.05)}" bIns="${emu(.05)}"><a:noAutofit/></a:bodyPr><a:lstStyle/>${body}</p:txBody></p:sp>`;
}
const group = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
function relationships(entries: readonly { id: string; type: string; target: string; external?: boolean }[]): string {
  return documentXml(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${entries.map(entry => `<Relationship Id="${entry.id}" Type="${R}/${entry.type}" Target="${xml(entry.target)}"${entry.external ? ' TargetMode="External"' : ''}/>`).join('')}</Relationships>`);
}

/** Editable summary deck, built from the same scientific content as the PDF. */
export function createPresentationPptx(slides: readonly PresentationSlide[], citations: readonly Citation[]): Uint8Array {
  const files: { name: string; text: string }[] = [];
  const add = (name: string, text: string) => files.push({ name, text });
  add('_rels/.rels', relationships([{ id: 'rId1', type: 'officeDocument', target: 'ppt/presentation.xml' }]));
  add('ppt/presentation.xml', documentXml(`<p:presentation xmlns:p="${P}" xmlns:a="${A}" xmlns:r="${R}"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="master"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, index) => `<p:sldId id="${256 + index}" r:id="slide${index + 1}"/>`).join('')}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`));
  add('ppt/_rels/presentation.xml.rels', relationships([{ id: 'master', type: 'slideMaster', target: 'slideMasters/slideMaster1.xml' }, ...slides.map((_, index) => ({ id: `slide${index + 1}`, type: 'slide', target: `slides/slide${index + 1}.xml` }))]));
  add('ppt/slideMasters/slideMaster1.xml', documentXml(`<p:sldMaster xmlns:p="${P}" xmlns:a="${A}" xmlns:r="${R}"><p:cSld><p:spTree>${group}</p:spTree></p:cSld><p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="layout"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`));
  add('ppt/slideMasters/_rels/slideMaster1.xml.rels', relationships([{ id: 'layout', type: 'slideLayout', target: '../slideLayouts/slideLayout1.xml' }, { id: 'theme', type: 'theme', target: '../theme/theme1.xml' }]));
  add('ppt/slideLayouts/slideLayout1.xml', documentXml(`<p:sldLayout xmlns:p="${P}" xmlns:a="${A}" xmlns:r="${R}" type="blank" preserve="1"><p:cSld name="Cuaderno"><p:spTree>${group}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`));
  add('ppt/slideLayouts/_rels/slideLayout1.xml.rels', relationships([{ id: 'master', type: 'slideMaster', target: '../slideMasters/slideMaster1.xml' }]));
  const colors = { dk1: color.ink, lt1: color.paper, dk2: color.deep, lt2: color.sand, accent1: '4E8F94', accent2: '52765A', accent3: 'A57948', accent4: color.water, accent5: color.deep, accent6: color.sand, hlink: color.deep, folHlink: '52765A' };
  const solid = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>';
  const line = `<a:ln w="9525">${solid}<a:prstDash val="solid"/></a:ln>`;
  add('ppt/theme/theme1.xml', documentXml(`<a:theme xmlns:a="${A}" name="Cuaderno de agua"><a:themeElements><a:clrScheme name="Agua">${Object.entries(colors).map(([key, value]) => `<a:${key}><a:srgbClr val="${value}"/></a:${key}>`).join('')}</a:clrScheme><a:fontScheme name="Legible"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Sobrio"><a:fillStyleLst>${solid.repeat(3)}</a:fillStyleLst><a:lnStyleLst>${line.repeat(3)}</a:lnStyleLst><a:effectStyleLst>${'<a:effectStyle><a:effectLst/></a:effectStyle>'.repeat(3)}</a:effectStyleLst><a:bgFillStyleLst>${solid.repeat(3)}</a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`));

  slides.forEach((slide, index) => {
    const links = [...new Set([...(slide.references?.map(reference => reference.url) ?? []), ...slide.citationIds.map(id => {
      const citation = citations.find(item => item.id === id);
      if (!citation) throw new Error(`Referencia desconocida: ${id}`);
      return citation.url;
    })])];
    const linkId = (url: string) => `link${links.indexOf(url) + 1}`;
    let shapes = textBox(2, 'Tema', .65, .3, 12, .45, [{ text: slide.subtitle, size: 12 }]);
    shapes += textBox(3, 'Título', .65, .8, 12, .9, [{ text: slide.title, size: 30, bold: true }]);
    if (slide.references) {
      slide.references.forEach((reference, position) => {
        shapes += textBox(10 + position, 'Referencia', position < 4 ? .65 : 6.8, 1.9 + (position % 4) * 1.17, 5.8, 1.1, [
          { text: reference.title, size: 13, bold: true, link: linkId(reference.url) },
          { text: `${reference.publisher} · ${reference.year}`, size: 10 },
          { text: reference.url, size: 8, link: linkId(reference.url) },
        ]);
      });
    } else {
      const paragraphs: Paragraph[] = slide.paragraphs.map(text => ({ text, size: 18 }));
      slide.items.forEach(item => { paragraphs.push({ text: item.title, bold: true, italic: item.italicTitle, size: 18 }, { text: item.text, size: 16 }); });
      shapes += textBox(4, 'Contenido editable', .65, 1.85, slide.visual === 'light' ? 7.3 : 12, 4.85, paragraphs);
      if (slide.visual === 'light') {
        const zones = [['Fótica o eufótica', 'Luz suficiente para fotosíntesis', color.water, color.ink], ['Disfótica', 'Luz tenue; fotosíntesis insuficiente', color.deep, color.paper], ['Afótica', 'No llega luz solar', color.ink, color.paper]];
        zones.forEach((zone, position) => { shapes += textBox(10 + position, 'Zona de luz', 8.5, 1.9 + position * 1.4, 4.1, 1.3, [{ text: zone[0], size: 20, bold: true, color: zone[3] }, { text: zone[1], size: 14, color: zone[3] }], zone[2]); });
        shapes += textBox(14, 'Alcance del esquema', 8.5, 6.1, 4.1, .45, [{ text: 'Superficie ↓ profundidad · Sin escala', size: 11 }]);
      }
    }
    const sources: Paragraph[] = slide.citationIds.map((id, sourceIndex) => {
      const citation = citations.find(item => item.id === id)!;
      return { text: `${sourceIndex > 0 ? ' · ' : ''}${citation.short}`, size: 9, link: linkId(citation.url) };
    });
    // Source labels share a single paragraph with separate clickable runs.
    shapes += textBox(90, 'Fuentes', .65, 6.85, 10.8, .45, sources, undefined, true);
    shapes += textBox(91, 'Número de diapositiva', 11.6, 6.85, 1, .45, [{ text: `${index + 1} / ${slides.length}`, size: 10 }]);
    add(`ppt/slides/slide${index + 1}.xml`, documentXml(`<p:sld xmlns:p="${P}" xmlns:a="${A}" xmlns:r="${R}"><p:cSld name="${xml(slide.title)}"><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${color.paper}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree>${group}${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`));
    add(`ppt/slides/_rels/slide${index + 1}.xml.rels`, relationships([{ id: 'layout', type: 'slideLayout', target: '../slideLayouts/slideLayout1.xml' }, ...links.map(url => ({ id: linkId(url), type: 'hyperlink', target: url, external: true }))]));
  });
  const overrides = [
    ['ppt/presentation.xml', 'presentation.main'], ['ppt/slideMasters/slideMaster1.xml', 'slideMaster'], ['ppt/slideLayouts/slideLayout1.xml', 'slideLayout'],
    ...slides.map((_, index) => [`ppt/slides/slide${index + 1}.xml`, 'slide']),
  ].map(([part, type]) => `<Override PartName="/${part}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.${type}+xml"/>`).join('');
  add('[Content_Types].xml', documentXml(`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${overrides}</Types>`));
  return createZip(files);
}
