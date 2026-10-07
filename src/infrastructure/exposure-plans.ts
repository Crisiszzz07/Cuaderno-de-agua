import type { ExposurePlan } from '../domain/exposure-timer.ts';

// Topic boundaries from the oral guide; the second route reserves three minutes for the activity.
export const exposurePlans: readonly ExposurePlan[] = [
  { id: 'oral', label: 'Guión oral · 14:30 + margen', stages: [
    { id: 'concepto', label: 'Concepto y organización ecológica', endSeconds: 210 },
    { id: 'colombia', label: 'Colombia y condiciones ambientales', endSeconds: 420 },
    { id: 'vida', label: 'Flora, fauna y especies amenazadas', endSeconds: 630 },
    { id: 'conservacion', label: 'Presiones, servicios y conservación', endSeconds: 870 },
    { id: 'cierre', label: 'Margen de cierre', endSeconds: 900 },
  ] },
  { id: 'activity', label: 'Con actividad · 12 + 3 minutos', stages: [
    { id: 'concepto', label: 'Concepto y organización ecológica', endSeconds: 180 },
    { id: 'colombia', label: 'Colombia y condiciones ambientales', endSeconds: 360 },
    { id: 'vida', label: 'Flora, fauna y especies amenazadas', endSeconds: 540 },
    { id: 'conservacion', label: 'Presiones, servicios y conservación', endSeconds: 720 },
    { id: 'actividad', label: 'Actividad y cierre', endSeconds: 900 },
  ] },
];
