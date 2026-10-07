# Contenido y evidencia

Revisión de fuentes: **6 de octubre de 2026**. Las afirmaciones del sitio se sustentan en fuentes institucionales y publicaciones científicas públicas. Esta tabla relaciona cada bloque con su evidencia y sus límites.

| Bloque | Fuente y alcance |
| --- | --- |
| Definición y zonas de luz | [NOAA NOS](https://oceanservice.noaa.gov/facts/light_travel.html) y [NOAA NCEI/CMECS](https://www.ncei.noaa.gov/waf/data-atlas-waf/products/html/environmentalPlates/CMECS_PhoticQualityLayerGuidance.htm). Se matiza la referencia de 200 m; los gráficos no tienen escala. |
| Colombia | [SIAC](https://www.siac.gov.co/regional), [IDEAM](https://ideam.gov.co/sala-de-prensa/boletines/Bolet%C3%ADn-de-Alertas-Hidrol%C3%B3gicas-%28BAH%29), [Flórez et al., 2016](https://doi.org/10.21068/C2016s01a03), estudio de Ayapel y plan de manejo. El contorno continental se basa en Natural Earth, generalizado para visualización; las etiquetas y los trazos de agua son didácticos. [INVEMAR](https://servicios.invemar.org.co/inf-ier) sustenta los aproximadamente 3.531 km de costa como contexto geográfico, no como extensión fótica. La transparencia determina una zona funcional variable. |
| Factores y turbidez | CMECS, [Zabala Agudelo et al., 2019](https://doi.org/10.21068/c2019.v20n02a01) y plan de manejo. La relación general luz–turbidez no se convierte en una cifra universal. |
| Productores y consumidores | [NOAA Education](https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs), [material estuarino de NOAA](https://repository.library.noaa.gov/view/noaa/35467/noaa_35467_DS1.pdf) y estudio de Ayapel. La red mezcla ejemplos para explicar rutas; no pretende describir una comunidad real. |
| Fitoplancton colombiano | [Rodríguez-Moreno et al., 2022](https://revistas.humboldt.org.co/index.php/biota/article/view/903). Se presenta diversidad documentada, sin extrapolar cantidades de registros a abundancia actual. |
| Peces herbívoros y pastos | [NOAA Fisheries](https://www.fisheries.noaa.gov/feature-story/restoring-natural-grazing-processes-can-help-coral-reefs) y [NOAA NOS sobre vegetación acuática](https://oceanservice.noaa.gov/facts/underwaterplants.html). El papel de los herbívoros depende del contexto. |
| Corales colombianos | [Plan PNN 2019–2024, publicado en 2020](https://www.parquesnacionales.gov.co/wp-content/uploads/2020/10/planes-de-manejo-pnn-los-corales-del-rosario-y-san-bernardo.pdf), pp. 77 y 116–129; noticia de restauración. Los nombres científicos se escriben en cursiva. Las fichas nacionales EN de A. palmata y CR de A. cervicornis están en el [Libro rojo de INVEMAR, 2002](https://www.invemar.org.co/redcostera1/invemar/docs/lrojo/LR_INVERTEBRADOS.pdf), pp. 48 y 51. El [listado oficial de MinAmbiente de 2024](https://www.minambiente.gov.co/wp-content/uploads/2024/02/Resolucion-0126-de-2024.pdf) conserva esas categorías. Se distingue evaluación publicada en 2002 de listado de 2024; no se inventa una reevaluación en 2024 ni se confunden categorías nacionales con globales. |
| Sedimentos, nutrientes y calentamiento | Plan PNN, [EPA](https://www.epa.gov/nutrientpollution/effects-environment) y [NOAA sobre blanqueamiento](https://oceanservice.noaa.gov/facts/coral_bleach.html). Son cadenas causales posibles, no predicciones inevitables. |
| Servicios y acciones | NOAA sobre redes y vegetación, Flórez et al., [EPA sobre humedales](https://www.epa.gov/report-environment/wetlands) y plan PNN. Los servicios se atribuyen al hábitat correspondiente, no a toda agua iluminada por igual. |
| Guarderías de coral | [PNN, 27 de enero de 2026](https://www.parquesnacionales.gov.co/sala-prensa/conozca-la-alianza-comunitaria-por-el-cuidado-de-los-arrecifes-de-coral-en-el-parque-nacional-natural-corales-del-rosario-y-san-bernardo/). Confirma participación local y ambas especies de Acropora. |
| Actividad | CMECS, EPA y NOAA sobre blanqueamiento. Los tres escenarios son situaciones didácticas inventadas, no reportes de eventos ocurridos en Colombia. |

## Cómo editar

1. Cambia los bloques en `src/infrastructure/content.ts`, los escenarios en `scenarios.ts` y las referencias en `citations.ts`.
2. Añade a cada afirmación su referencia por ID. Los tipos ayudan a mantener la estructura; no sustituyen la revisión científica.
3. Comprueba que la fuente sostiene exactamente la afirmación, para el lugar y la fecha correspondientes. Diferencia posibilidad de certeza, asociación de causalidad y ejemplo local de patrón general.
4. Si una fuente falla, conserva su enlace original y añade una lectura alternativa del mismo trabajo. No sustituyas silenciosamente su evidencia por otra.
5. Actualiza `REVIEW_DATE` en `src/shared/constants.ts` solo después de revisar las fuentes de nuevo. Ejecuta los cuatro comandos de calidad del README.

La bibliografía conserva los DOI y los enlaces oficiales del Instituto Humboldt como rutas de acceso a los artículos. El plan de manejo 2019–2024 se usa como documento histórico; no permite atribuir vigencia actual a categorías de amenaza. Las figuras de las fuentes no se redistribuyen.

## Criterios que deben conservarse

La zona fótica es funcional y variable. La turbidez puede limitar la luz. Un aporte de nutrientes no mejora siempre el equilibrio: puede favorecer proliferaciones y pérdida posterior de oxígeno. El coral blanqueado no está necesariamente muerto. La materia se recicla; la energía fluye. Las especies y comunidades responden a presiones que pueden actuar en conjunto.

NO SE PUEDE AÑADIR porcentajes, mapas de extensión o categorías de amenaza sin una fuente verificable, fecha y contexto. Ante incertidumbre, es mejor omitr la afirmación o registrar la verificación pendiente aquí a que inventar datos.

La vista PDF y el PPTX usan `preparePresentation()`, que selecciona los mismos párrafos y bloques tipados; no mantienen una segunda colección de afirmaciones científicas. Cada diapositiva de contenido conserva sus fuentes y las últimas dos reúnen la bibliografía. Los escenarios se exportan como consignas y explicaciones, sin respuestas seleccionadas por visitantes. Si cambias el contenido, regenera el PPTX y revisa que el texto siga cabiendo en los formatos de exportación.

La actividad en vivo selecciona tres preguntas de esos escenarios en `live-questions.ts`: luz y turbidez, oxígeno tras exceso de nutrientes y simbiosis coral–alga bajo estrés térmico. Cada acierto vale un punto. Las dos valoraciones de claridad son preguntas de percepción, sin respuesta correcta ni puntaje; no se deben presentar sus cambios como evidencia de aprendizaje o de causalidad. Los porcentajes se calculan únicamente sobre conexiones con respuestas completas. No se rellenan estadísticas si nadie respondió.

Las exportaciones incluyen un enlace al sitio de la actividad. El QR pertenece a una sesión temporal iniciada en la web; no se inserta un QR vencido o ficticio en el PDF. La bibliografía muestra títulos, editor, año y enlaces completos como destinos clicables; las etiquetas de enlace se acortan para evitar cruces al imprimir.
