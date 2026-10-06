import type { ActivityScenario } from '../domain/models.ts';

export const scenarios = [
  {
    id: 'sedimentos', title: 'Más sedimentos',
    context: 'Después de perder vegetación en una cuenca, la lluvia arrastra suelo hacia una ciénaga. El agua se vuelve más turbia.',
    citations: ['cmecs', 'ayapel'],
    questions: [
      { id: 'factor', prompt: '¿Qué factor se altera primero?', expected: 'turbidez', explanation: 'Los sedimentos suspendidos aumentan la turbidez; no es necesario que cambie la salinidad.', options: [ { id: 'temperatura', label: 'Temperatura del agua' }, { id: 'turbidez', label: 'Turbidez y transparencia' }, { id: 'salinidad', label: 'Salinidad' } ] },
      { id: 'balance', prompt: '¿Qué pasa con la luz?', expected: 'menos', explanation: 'Las partículas absorben y dispersan luz: puede llegar menos a las plantas del fondo. La zona fótica puede hacerse menos profunda.', options: [ { id: 'mas', label: 'Llega más luz al fondo' }, { id: 'igual', label: 'La transparencia no influye' }, { id: 'menos', label: 'La luz penetra menos' } ] },
      { id: 'consequence', prompt: '¿Qué consecuencia es probable?', expected: 'fotosintesis', explanation: 'Si llega menos luz, los productores sumergidos pueden fotosintetizar menos. La magnitud depende del sitio y de cuánto dure la turbidez.', options: [ { id: 'fotosintesis', label: 'Menos fotosíntesis en plantas sumergidas' }, { id: 'desaparecen', label: 'Todos los peces desaparecen de inmediato' }, { id: 'sin-cambio', label: 'Los productores nunca cambian' } ] },
    ],
  },
  {
    id: 'nutrientes', title: 'Nutrientes en exceso',
    context: 'A una laguna llegan aguas residuales o escorrentía con fertilizantes. Aumenta el aporte de nitrógeno y fósforo.',
    citations: ['nutrients'],
    questions: [
      { id: 'factor', prompt: '¿Qué factor se altera primero?', expected: 'nutrientes', explanation: 'El aporte inicial aumenta los nutrientes. El oxígeno puede disminuir después, durante la respiración y descomposición de biomasa.', options: [ { id: 'oleaje', label: 'Oleaje' }, { id: 'oxigeno', label: 'Oxígeno, antes de llegar los nutrientes' }, { id: 'nutrientes', label: 'Disponibilidad de nutrientes' } ] },
      { id: 'balance', prompt: '¿Cómo cambia el equilibrio?', expected: 'algas', explanation: 'El enriquecimiento puede favorecer un crecimiento excesivo de algas que sombrea a otros productores. Más nutrientes no siempre significan un ecosistema más sano.', options: [ { id: 'algas', label: 'Pueden proliferar algas y reducir la luz' }, { id: 'clara', label: 'El agua siempre se aclara' }, { id: 'equilibrio', label: 'El equilibrio siempre mejora' } ] },
      { id: 'consequence', prompt: '¿Qué consecuencia es probable?', expected: 'hipoxia', explanation: 'La descomposición consume oxígeno y puede afectar a peces e invertebrados. No toda proliferación de algas es tóxica ni toda laguna responde igual.', options: [ { id: 'mas-oxigeno', label: 'El oxígeno nunca disminuye' }, { id: 'hipoxia', label: 'Menos oxígeno disponible para consumidores' }, { id: 'corales', label: 'Se forman arrecifes en la laguna' } ] },
    ],
  },
  {
    id: 'temperatura', title: 'Un arrecife más cálido',
    context: 'Un arrecife somero atraviesa un período de agua inusualmente cálida. Algunos corales muestran señales de estrés.',
    citations: ['bleaching', 'pnn-plan'],
    questions: [
      { id: 'factor', prompt: '¿Qué factor se altera primero?', expected: 'temperatura', explanation: 'El cambio inicial es la temperatura. El agua puede seguir clara mientras los corales sufren estrés térmico.', options: [ { id: 'turbidez', label: 'Turbidez obligatoriamente' }, { id: 'temperatura', label: 'Temperatura del agua' }, { id: 'sedimentos', label: 'Cantidad de sedimentos' } ] },
      { id: 'balance', prompt: '¿Qué relación puede alterarse?', expected: 'simbiosis', explanation: 'El estrés térmico puede provocar la pérdida de algas simbióticas. Esto causa blanqueamiento y reduce el aporte de energía al coral.', options: [ { id: 'sin-luz', label: 'El sol deja de iluminar el mar' }, { id: 'simbiosis', label: 'La simbiosis entre coral y algas' }, { id: 'mas-energia', label: 'El coral recibe energía ilimitada' } ] },
      { id: 'consequence', prompt: '¿Qué consecuencia es probable?', expected: 'vulnerable', explanation: 'El coral blanqueado está vivo, pero es más vulnerable. Puede recuperarse si el estrés disminuye; si persiste, puede morir y afectar al hábitat arrecifal.', options: [ { id: 'vulnerable', label: 'Mayor vulnerabilidad y posible pérdida de hábitat' }, { id: 'muerte', label: 'Blanquearse equivale siempre a morir' }, { id: 'beneficio', label: 'Todos los organismos se benefician' } ] },
    ],
  },
] as const satisfies readonly ActivityScenario[];
