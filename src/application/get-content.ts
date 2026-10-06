import { sections, species, threats, services, actions, lightZones, foodWeb, regions, presentation } from '../infrastructure/content.ts';
import { scenarios } from '../infrastructure/scenarios.ts';
import { citations } from '../infrastructure/citations.ts';

export function getContent() {
  return { sections, species, threats, services, actions, lightZones, foodWeb, regions, presentation, scenarios };
}

export function getReferences(ids?: readonly string[]) {
  if (!ids) return citations;
  return ids.map(id => {
    const citation = citations.find(item => item.id === id);
    if (!citation) throw new Error(`Referencia desconocida: ${id}`);
    return citation;
  });
}
