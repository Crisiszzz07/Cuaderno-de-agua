import type { EcosystemSection, PresentationSlide } from '../domain/models.ts';
import { getContent, getReferences } from './get-content.ts';
import { SITE_TITLE } from '../shared/constants.ts';

/** PDF and PPTX share this model; scientific copy stays in the content registry. */
export function preparePresentation(): readonly PresentationSlide[] {
  const content = getContent();
  const [light, colombia, factors, network, life, pressure, care] = content.sections;
  function slide(section: EcosystemSection, visual?: PresentationSlide['visual']): PresentationSlide {
    const citationIds = [...new Set([...section.citations, ...(section.blocks?.flatMap(block => block.citations) ?? [])])];
    return { id: section.id, title: section.title, subtitle: section.lead, paragraphs: section.paragraphs, items: [], citationIds, visual };
  }
  const references = getReferences();
  const contentSlides: PresentationSlide[] = [
    { id: 'portada', title: SITE_TITLE, subtitle: 'Ecología · Universidad de Cartagena', paragraphs: ['¿Qué ocurre con la vida acuática cuando cambia la luz?', 'Una mirada a las aguas iluminadas de Colombia: fotosíntesis, redes alimentarias y conservación.'], items: [], citationIds: ['noaa-light', 'cmecs'], visual: 'coast' },
    slide(light, 'light'),
    slide(colombia, 'map'),
    { ...slide(factors, 'turbidity'), items: factors.blocks },
    { ...slide(network, 'food'), paragraphs: [network.paragraphs[1]], items: network.blocks },
    { ...slide(life), items: life.blocks, citationIds: [...life.citations, 'grazing', 'plants', 'bleaching', 'pnn-plan'] },
    { id: 'corales', title: 'Dos corales del Caribe colombiano', subtitle: 'Ambientes someros iluminados · Categorías nacionales', paragraphs: [life.blocks[2].text], items: content.species.map(item => ({ title: item.scientificName, text: `${item.commonName}. ${item.conservation.category} en Colombia. Evaluación publicada: INVEMAR, ${item.conservation.assessmentYear}; listado oficial: MinAmbiente, ${item.conservation.listingYear}. ${item.description}`, italicTitle: true })), citationIds: ['pnn-plan', 'invemar-redbook', 'national-threats'], visual: 'corals' },
    { ...slide(pressure), paragraphs: [pressure.paragraphs[0]], items: content.threats.map(threat => ({ title: threat.activity, text: `${threat.change} → ${threat.light} → ${threat.consequence}.` })), citationIds: [...new Set([...pressure.citations, ...content.threats.flatMap(threat => threat.citations)])] },
    { ...slide(care), items: content.services, citationIds: [...new Set([...care.citations, ...content.services.flatMap(service => service.citations)])] },
    { id: 'acciones', title: 'Acciones y restauración comunitaria', subtitle: care.lead, paragraphs: [care.blocks[0].text], items: content.actions, citationIds: ['pnn-restoration', 'pnn-plan', 'nutrients', 'wetlands', 'cmecs'] },
    { id: 'actividad-grupos', title: 'Actividad en grupos', subtitle: 'Tres minutos · Conversar, contrastar y compartir', paragraphs: ['Abrir la página de la actividad. El equipo expositor inicia una sesión y allí se genera el QR para que los grupos respondan desde sus teléfonos.', 'El PDF no contiene un QR de sesión: cada código se crea en el sitio y vence al terminar la actividad.'], activityLink: 'https://cuadernodeagua.duckdns.org/#actividad', items: content.scenarios.map(scenario => ({ title: scenario.title, text: scenario.context })), citationIds: content.sections[7].citations },
    ...content.scenarios.map(scenario => ({ id: `explicacion-${scenario.id}`, title: scenario.title, subtitle: 'Actividad · Explicación para el cierre', paragraphs: [scenario.context], items: scenario.questions.map(question => ({ title: question.prompt, text: question.explanation })), citationIds: scenario.citations })),
  ];
  const bibliographySlides: PresentationSlide[] = [0, Math.ceil(references.length / 2)].map((offset, index) => ({
    id: `bibliografia-${index + 1}`, title: 'Seguir la evidencia', subtitle: `Bibliografía pública · ${index + 1} de 2`, paragraphs: [], items: [], citationIds: [], references: references.slice(offset, offset + Math.ceil(references.length / 2)),
  }));
  return [...contentSlides, ...bibliographySlides];
}
