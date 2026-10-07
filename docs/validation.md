# Validación

Esta guía describe las comprobaciones necesarias para revisar cambios de contenido, interfaz y despliegue. Los resultados de una ejecución corresponden a la versión y al entorno donde se obtuvieron; no certifican por sí solos accesibilidad, compatibilidad visual o disponibilidad del sitio publicado.

## Comprobaciones automáticas

Desde la raíz del proyecto:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
node scripts/check-built-html.ts
```

| Comprobación | Alcance |
| --- | --- |
| `lint` | Sintaxis, uso de TypeScript y reglas de dependencias entre capas |
| `typecheck` | Tipos del código, servicio, scripts, pruebas y componentes Astro |
| `test` | Evaluación de escenarios, fuentes críticas, contraste, sesiones, protocolo HTTP, QR, exportación y comprobador de despliegue |
| `build` | Generación de páginas estáticas y presentación PPTX |
| `check-built-html` | Anclas, identificadores, controles accesibles, nombres científicos y recursos locales del sitio construido |

Las pruebas de contraste comprueban las combinaciones definidas en la paleta. La revisión manual debe considerar también el tamaño del texto, el foco, el zoom y cualquier superficie añadida al diseño.

## Pruebas de navegador

Instalar Chromium y construir el sitio antes de ejecutar:

```bash
pnpm exec playwright install chromium
pnpm build
pnpm test:browser
pnpm test:live:browser
```

La primera prueba revisa tamaños de pantalla, actividad local, controles de animación, pantalla completa y exportación PDF. La segunda simula un anfitrión y dos participantes contra el adaptador HTTP, con un reloj controlado para comprobar las fases sin esperar tres minutos reales.

La revisión de exportación comprueba también que la portada general no incluya el reparto por integrantes. La prueba de navegador simula acceso denegado y autorizado a la portada personalizada, eliminación del código del campo y limpieza de autoría después de imprimir. Las pruebas del servicio verifican origen HTTPS, hash, límite de intentos y ausencia de datos privados en respuestas denegadas. El ensayo final requiere el secreto instalado y un navegador real.

Las capturas y archivos de comprobación se guardan en `test-results/`, excluido del repositorio. Las nuevas capturas de interfaz se escriben en `test-results/revision-motion/`; las de participación, en `test-results/live/`. La simulación no sustituye una sesión con teléfonos reales y el servidor publicado.

## Revisión manual de la interfaz

- Revisar móvil, tableta, portátil y proyector: texto legible, diagramas completos y ausencia de desplazamiento horizontal accidental.
- Recorrer enlaces y controles con Tab, Enter y Espacio; usar flechas en los grupos de opciones. El foco debe permanecer visible y seguir un orden comprensible.
- Comprobar títulos, leyendas, explicaciones y resultados con un lector de pantalla.
- Revisar zoom al 200 % y preferencia de movimiento reducido. La pausa de animaciones debe mantenerse entre gráficos.
- Activar modo exposición y pantalla completa, navegar entre secciones y salir con Esc. La navegación normal debe restaurarse.
- Completar y reiniciar la actividad local. Sus explicaciones también deben estar disponibles sin JavaScript.

## Exportaciones

El PDF de `/exposicion/` debe contener 16 diapositivas, sin texto recortado. Para imprimir: formato horizontal, gráficos de fondo activados, márgenes y encabezados según las instrucciones de la página. Revisar el archivo resultante, no únicamente la vista del navegador.

Abrir el PPTX en el editor que se utilizará. Comprobar distribución, textos editables, cursivas y enlaces de fuentes, y confirmar que no solicita reparar el archivo. Las pruebas del empaquetado no garantizan una representación idéntica en PowerPoint y LibreOffice.  (posible mejora a futuro)

## Contenedor y sitio publicado

```bash
podman build -t ecosistemas-foticos .
podman run --rm -p 8080:8080 ecosistemas-foticos
```

Desde otra terminal:

```bash
curl --fail http://localhost:8080/api/live/health
```

La respuesta debe indicar `available: true`, `persistence: "memory"` y `durationSeconds: 180`. Para un despliegue público, seguir las [plantillas de producción](../deploy/README.md) y comprobar:

```bash
pnpm check:deployment -- https://example.org
```

Sustituir `example.org` por el dominio publicado. El comprobador valida recursos, salud, cabeceras y redirección HTTP; no crea sesiones. DNS, firewall, renovación del certificado y capacidad del servidor requieren revisión independiente.

El ensayo con dispositivos reales debe cubrir:

1. Abrir el mismo origen HTTPS en el anfitrión y los teléfonos.
2. Crear una sesión, escanear el QR y completar las preguntas.
3. Comprobar las fases de 30 segundos de entrada, 105 de respuestas y 45 de resultados.
4. Contrastar el puntaje, las estadísticas y la separación entre aciertos y percepción.
5. Confirmar el borrado a los 180 segundos y la opción de terminar antes.
6. Repetir desde la red de uso y con la concurrencia prevista, sin reiniciar el servicio durante la sesión.

## Registrar resultados

Una contribución debe indicar versión revisada, comandos ejecutados, resultados y comprobaciones pendientes. Las capturas o registros compartidos no deben contener datos personales, credenciales ni accesos temporales de sesiones.

Si una herramienta no puede ejecutarse, registrar la limitación sin presentarla como una prueba aprobada. Los informes de una instalación concreta y las instrucciones personales no forman parte de esta guia.
