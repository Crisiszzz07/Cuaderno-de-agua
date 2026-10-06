import type { ContentBlock, EcosystemSection, Species, Threat } from '../domain/models.ts';

export const sections = [
  { id: 'luz', nav: 'La luz', title: 'La luz define la zona.', lead: 'Qué son los ecosistemas fóticos', paragraphs: [
    'Son las zonas iluminadas de los ambientes acuáticos donde hay suficiente luz para la fotosíntesis. No son un solo bioma fijo: esta zona funcional aparece en distintos cuerpos de agua.',
    'Su profundidad depende de la transparencia. Los primeros 200 metros son una referencia común en océano abierto y claro, no una regla universal para mares, ríos o ciénagas.',
  ], citations: ['noaa-light', 'cmecs'] },
  { id: 'colombia', nav: 'Colombia', title: 'Dos mares. Muchas aguas interiores.', lead: 'Dónde están en Colombia', paragraphs: [
    'La franja iluminada está en el mar Caribe colombiano, incluido San Andrés y Providencia, y en el océano Pacífico colombiano.',
    'También está en las aguas superficiales de ríos, ciénagas, lagunas, humedales y embalses. Las cinco grandes áreas hidrográficas son Magdalena–Cauca, Caribe, Pacífico, Orinoco y Amazonas.',
    'En la ciénaga de Ayapel se ha estudiado cómo cambia el fitoplancton entre períodos de inundación y sequía. Es un ejemplo continental: la zona fótica no es exclusivamente marina.',
  ], citations: ['siac', 'ideam', 'wetlands', 'ayapel', 'pnn-plan'] },
  { id: 'factores', nav: 'Factores', title: 'El agua también filtra la luz.', lead: 'Factores ambientales', paragraphs: [
    'Las partículas suspendidas absorben y dispersan la luz. Cuando aumenta la turbidez, la luz penetra menos y la zona de fotosíntesis puede hacerse más superficial.',
  ], citations: ['cmecs', 'ayapel'], blocks: [
    { title: 'En todos los ambientes', text: 'Luz, transparencia y turbidez condicionan la fotosíntesis. Temperatura, nutrientes y oxígeno disuelto influyen en el funcionamiento de las comunidades.', citations: ['cmecs', 'food-web', 'nutrients', 'bleaching'] },
    { title: 'En el mar', text: 'Salinidad, corrientes, oleaje y sustrato modulan el hábitat y el transporte de organismos y materiales.', citations: ['pnn-plan'] },
    { title: 'En aguas continentales', text: 'Caudal, profundidad, inundación y sedimentos cambian las condiciones del agua y la distribución de los productores.', citations: ['ayapel'] },
  ] },
  { id: 'red', nav: 'Red de vida', title: 'De la luz a una red de vida.', lead: 'Organización ecológica', paragraphs: [
    'Los productores convierten energía solar en materia orgánica. Los consumidores obtienen alimento de otros organismos; bacterias y hongos descomponen los restos y reciclan nutrientes.',
    'El fitoplancton está en la base de muchas redes alimentarias acuáticas. El esquema conecta rutas posibles: no todos estos organismos conviven en cada sitio.',
  ], citations: ['food-web', 'decomposers'], blocks: [
    { title: 'Productores', text: 'Fitoplancton, macroalgas, pastos marinos, perifiton y plantas acuáticas. El perifiton reúne organismos adheridos a superficies; su componente fotosintético actúa como productor.', citations: ['food-web', 'plants', 'ayapel'] },
    { title: 'Consumidores', text: 'Zooplancton, invertebrados, peces, aves, tortugas y otros depredadores. Su dieta determina su función; las tortugas, por ejemplo, no ocupan todas el mismo nivel.', citations: ['food-web'] },
    { title: 'Descomponedores', text: 'Bacterias y hongos transforman materia orgánica muerta y liberan nutrientes que vuelven a estar disponibles para los productores.', citations: ['decomposers'] },
  ] },
  { id: 'vida', nav: 'Habitantes', title: 'Pequeños productores, grandes conexiones.', lead: 'Flora, fauna y conservación', paragraphs: [
    'El fitoplancton incluye organismos microscópicos fotosintéticos. En el Caribe oceánico colombiano se han documentado comunidades diversas mediante investigaciones de varios años.',
  ], citations: ['caribbean-plankton'], blocks: [
    { title: 'Peces herbívoros', text: 'Al consumir algas pueden limitar su crecimiento y favorecer el espacio disponible para el asentamiento de corales. Su efecto depende del lugar y de otros herbívoros.', citations: ['grazing'] },
    { title: 'Praderas de pastos marinos', text: 'Son plantas con flores, no algas. Proporcionan alimento y refugio, sostienen zonas de cría y ayudan a estabilizar los sedimentos.', citations: ['plants'] },
    { title: 'Arrecifes someros', text: 'Los corales son animales. Muchos viven con algas simbióticas que fotosintetizan; la estructura del arrecife ofrece hábitat para otros organismos.', citations: ['bleaching', 'pnn-plan'] },
  ] },
  { id: 'presiones', nav: 'Presiones', title: 'Lo que ocurre en tierra llega al agua.', lead: 'Intervenciones humanas', paragraphs: [
    'Deforestación, erosión y minería pueden aumentar el aporte de sedimentos. La escorrentía agrícola y las aguas residuales pueden aportar nutrientes; los residuos, el turismo no regulado y la sobrepesca añaden presiones distintas.',
    'El calentamiento del agua puede causar estrés térmico. Las amenazas se combinan con enfermedades y daños físicos; ninguna causa explica por sí sola todos los cambios ecológicos.',
  ], citations: ['pnn-plan', 'nutrients', 'bleaching'], blocks: [
    { title: 'No toda presión reduce la luz', text: 'La sobrepesca modifica la red trófica; el turismo no regulado y los residuos pueden dañar organismos y hábitats. La temperatura altera la simbiosis coral–alga, aunque el agua siga clara.', citations: ['grazing', 'pnn-plan', 'bleaching'] },
  ] },
  { id: 'cuidar', nav: 'Cuidar', title: 'Cuidar el agua empieza en la cuenca.', lead: 'Servicios ecosistémicos y acciones', paragraphs: [
    'Los beneficios dependen de cada ambiente. La zona iluminada sostiene producción y redes alimentarias; arrecifes, praderas y humedales contribuyen con funciones diferentes.',
  ], citations: ['food-web', 'plants', 'wetlands'], blocks: [
    { title: 'Restauración con las comunidades', text: 'En Corales del Rosario y San Bernardo, guías, pescadores y líderes locales participan en guarderías de coral con apoyo técnico. Es un ejemplo colombiano de restauración comunitaria.', citations: ['pnn-restoration'] },
  ] },
  { id: 'actividad', nav: 'Actividad', title: 'Actividad en grupos', lead: 'Una conversación de 2 a 3 minutos', paragraphs: [
    'En la actividad en vivo, escaneen el QR para responder tres preguntas y valorar la claridad del tema. La sesión dura tres minutos. Si no pueden conectar los teléfonos, elijan un escenario de la alternativa local y conversen sobre sus relaciones ecológicas.',
  ], citations: ['cmecs', 'nutrients', 'bleaching'] },
] as const satisfies readonly EcosystemSection[];

export const lightZones = [
  { title: 'Fótica o eufótica', description: 'Luz suficiente para fotosíntesis.', label: 'Producción primaria', className: 'euphotic' },
  { title: 'Disfótica', description: 'Luz tenue, insuficiente para sostener fotosíntesis.', label: 'Penumbra', className: 'dysphotic' },
  { title: 'Afótica', description: 'No llega luz solar.', label: 'Oscuridad', className: 'aphotic' },
] as const;

export const species = [
  { scientificName: 'Acropora palmata', commonName: 'Coral cuerno de alce', description: 'Ramas anchas y aplanadas. Ejemplo de coral constructor de arrecifes someros del Caribe colombiano.', citations: ['pnn-plan', 'pnn-restoration'] },
  { scientificName: 'Acropora cervicornis', commonName: 'Coral cuerno de ciervo', description: 'Ramas delgadas y ramificadas. También está presente en el Caribe colombiano y en iniciativas de restauración.', citations: ['pnn-plan', 'pnn-restoration'] },
] as const satisfies readonly Species[];

export const threats = [
  { activity: 'Deforestación y erosión', change: 'Más sedimentos suspendidos', light: 'Menor penetración de luz', consequence: 'Menos fotosíntesis en productores sumergidos', citations: ['cmecs', 'pnn-plan'] },
  { activity: 'Vertimientos y fertilizantes', change: 'Exceso de nutrientes', light: 'Proliferación de algas y sombreado', consequence: 'La descomposición puede agotar oxígeno y afectar peces', citations: ['nutrients'] },
  { activity: 'Emisiones que favorecen el calentamiento', change: 'Agua más cálida y estrés térmico', light: 'Se altera la simbiosis coral–alga', consequence: 'Blanqueamiento y menor aporte de energía al coral', citations: ['bleaching'] },
] as const satisfies readonly Threat[];

export const services = [
  { title: 'Alimento y biodiversidad', text: 'Redes alimentarias y hábitats sostienen peces, otros organismos y actividades pesqueras.', citations: ['food-web', 'plants'] },
  { title: 'Protección costera', text: 'Los arrecifes amortiguan oleaje; los pastos contribuyen a estabilizar sedimentos.', citations: ['pnn-plan', 'plants'] },
  { title: 'Regulación hídrica y calidad del agua', text: 'Los humedales retienen y liberan agua; su vegetación y suelos participan en el filtrado de contaminantes.', citations: ['wetlands', 'wetland-services'] },
] as const satisfies readonly ContentBlock[];

export const actions = [
  { title: 'Tratar y prevenir', text: 'Manejar aguas residuales y escorrentía agrícola; reducir erosión y aportes de sedimentos.', citations: ['nutrients', 'pnn-plan'] },
  { title: 'Proteger y usar con cuidado', text: 'Conservar cuencas y humedales, respetar áreas protegidas y practicar turismo responsable.', citations: ['wetlands', 'pnn-plan'] },
  { title: 'Observar para decidir', text: 'Monitorear transparencia, nutrientes y comunidades; ajustar el manejo con evidencia local.', citations: ['cmecs', 'pnn-plan'] },
] as const satisfies readonly ContentBlock[];

export const regions = [
  { title: 'Caribe e islas', text: 'Aguas costeras y oceánicas, arrecifes someros y praderas. Incluye San Andrés y Providencia.' },
  { title: 'Pacífico', text: 'La capa iluminada de aguas costeras y oceánicas; su alcance varía con la claridad del agua.' },
  { title: 'Aguas continentales', text: 'Superficies iluminadas en las cinco áreas hidrográficas. Un humedal no es enteramente fótico: lo es su agua con luz suficiente.' },
] as const;

export const foodWeb = {
  energy: 'Luz solar',
  producers: 'Fitoplancton / algas y plantas',
  first: 'Zooplancton / herbívoros',
  second: 'Peces y otros consumidores',
  predators: 'Aves / peces depredadores',
  detritus: 'Restos de todos los niveles',
  decomposers: 'Bacterias y hongos',
  nutrients: 'Nutrientes',
  description: 'La luz aporta energía a los productores. El fitoplancton alimenta al zooplancton y a peces que comen plancton; algas y plantas alimentan a herbívoros. Estos alimentan a otros peces y depredadores. Los restos de todos los niveles pasan a bacterias y hongos, que liberan nutrientes aprovechados por los productores. Las flechas continuas muestran transferencia de alimento; las discontinuas, reciclaje de materia. La energía fluye y no se recicla.',
} as const;

export const presentation = [
  { person: 'Integrante 1', time: '0–3 min', topic: 'Concepto y luz', target: 'luz' },
  { person: 'Integrante 2', time: '3–6 min', topic: 'Colombia y factores', target: 'colombia' },
  { person: 'Integrante 3', time: '6–9 min', topic: 'Red y habitantes', target: 'red' },
  { person: 'Integrante 4', time: '9–12 min', topic: 'Presiones y cuidado', target: 'presiones' },
] as const;
