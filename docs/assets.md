# Recursos visuales y atribución

Las ilustraciones y los diagramas de la página son originales, construidos en SVG o CSS. El proyecto no distribuye fotografías. El contorno continental utiliza coordenadas públicas de Natural Earth. La licencia del proyecto y de sus recursos originales está pendiente de decisión por el propietario. Los avisos de las dependencias se conservan por separado.

| Recurso | Archivo | Procedencia y alcance |
| --- | --- | --- |
| Costa con capas de papel | `src/ui/components/CoastalScene.astro` | SVG original. Escena conceptual, no una costa identificable ni una medición. La fotosíntesis en aguas iluminadas se apoya en NOAA NOS/NCEI. |
| Columna de luz | `src/ui/components/LightColumn.astro` | Composición original en HTML/CSS, basada en las definiciones de [NOAA](https://oceanservice.noaa.gov/facts/light_travel.html) y [CMECS](https://www.ncei.noaa.gov/waf/data-atlas-waf/products/html/environmentalPlates/CMECS_PhoticQualityLayerGuidance.htm). Sin escala. |
| Colombia | `src/ui/components/ColombiaMap.astro` | Contorno continental derivado de [Natural Earth, Admin 0 Countries 1:110m](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/), [dominio público](https://www.naturalearthdata.com/about/terms-of-use/). Coordenadas originales WGS84 en `src/infrastructure/colombia-outline.ts`, extraídas de [su GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson), consulta del 7 de octubre de 2026. Transformación lineal de longitud/latitud y traducción a SVG; sin simplificación adicional. Los ríos, etiquetas y recuadro insular siguen siendo esquemáticos; no representa límites oficiales, superficies fóticas ni todas las islas. |
| Turbidez | `src/ui/components/Turbidity.astro` | Formas CSS originales. Comparación cualitativa a partir de CMECS; no contiene datos de muestreo. |
| Red trófica | `src/ui/components/FoodWeb.astro` | Diagrama original, basado en NOAA Education y su material estuarino. La versión móvil usa texto y conectores legibles. No reconstruye una red observada en un sitio específico. |
| Corales | `src/ui/components/CoralDrawing.astro` | Dibujos originales de ramificación. Son esquemas de forma, no fotografías ni una clave de identificación. Los ejemplos de especies están respaldados por PNN. |
| Textura de papel | `public/grain.svg` | Ruido procedural original, tenue y estático; sin información científica. |
| Símbolo del sitio | `public/favicon.svg` y encabezado | Trazos originales de agua y luz. |
| Presentación editable | `public/downloads/ecosistemas-foticos.pptx` | Archivo generado en cada build con texto del modelo de exposición y formas nativas originales. No tiene fotografías ni tipografías embebidas. La fuente solicitada al editor es Calibri, con sustitución según el dispositivo. No reproduce el diseño completo de los SVG. |
| QR de participación | `src/infrastructure/qr-code.ts` | Módulos generados localmente con [node-qrcode](https://github.com/soldair/node-qrcode), versión 1.5.4, licencia MIT. Codifica únicamente la dirección pública y el código temporal de sesión. No usa servicios de imágenes ni recursos externos. La licencia de esta dependencia no fija la del repositorio. |
| Tipografía | `tokens.css` | Fuentes instaladas en el dispositivo: Palatino y alternativas serif; Trebuchet y alternativas sans. No se distribuyen archivos de fuentes ni se cargan servicios de tipografía externos. Su aspecto puede variar entre sistemas. |

La referencia visual es [Foxglove Hollow](https://miaai-lab.github.io/Claude-Opus-5.5-100-HTML-Files/018-paper-cut-diorama.html): capas, bordes suaves y profundidad de papel. No se copió su código, ilustración, texto ni animación.

Los documentos científicos se enlazan; no se redistribuyen sus figuras.

`public/third-party-notices.txt` conserva los avisos MIT originales de node-qrcode y dijkstrajs, incluidos en el módulo de QR que se carga al abrir una sesión. Son licencias de esas dependencias, no una decisión de licencia para este proyecto.

Las animaciones son extensiones originales de estos mismos gráficos: capas de agua, peces, plantas, rayos, partículas y puntos sobre las flechas de alimento. No se añaden especies, fotografías, datos de campo o tasas cuantitativas. Su duración es una decisión de representación visual, no una medición ecológica. La red mantiene separado el flujo de alimento del reciclaje de nutrientes; los puntos móviles aparecen únicamente sobre las rutas de alimento. Pueden pausarse y no se exportan como animación al PDF o PPTX.
