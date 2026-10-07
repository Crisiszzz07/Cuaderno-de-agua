# Ecosistemas fóticos en Colombia

Un cuaderno web para acompañar una exposición universitaria de aprox 15 minutos para reemplazar las diapositivas estáticas que a veces pueden ser tediosas (aunque de mucha ayuda). El contenido que se cubre en este repo/página es: Explica dónde llega suficiente luz para la fotosíntesis, cómo sostiene las redes acuáticas y qué cambios pueden alterar su equilibrio.

Incluye ocho secciones, gráficos originales, bibliografía pública, modo exposición y una actividad por QR de tres minutos. Es una landing educativa hecha con **Astro y TypeScript**, que genera archivos estáticos. La actividad conectada añade un pequeño servicio de memoria: NO requiere cuentas, base de datos, secretos ni almacenamiento persistente.

## Empezar

Necesitas Node.js 24 o posterior y pnpm 10.33.2 o posterior. Usa pnpm para todos los comandos; el archivo `pnpm-lock.yaml` fija las dependencias.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abre `http://localhost:4321`. Para revisar la versión construida:

```bash
pnpm build
pnpm preview
```

`dist/` contiene la web estática. Para utilizar también las respuestas por QR:

```bash
pnpm live
```

Este comando construye la web y la sirve con la actividad en el puerto 8080. `pnpm dev` y `pnpm preview` permiten revisar el contenido pero no incluyen el servicio de respuestas. La versión actual se sirve desde la raíz de un dominio. Si se necesita una subruta se debe de ajustas `base`, los recursos públicos y las rutas de la actividad.

## Comandos

| Comando | Para qué sirve |
| --- | --- |
| `pnpm dev` | Desarrollo con actualización automática |
| `pnpm lint` | Reglas explícitas de sintaxis, TypeScript y arquitectura |
| `pnpm typecheck` | Tipos del código y props de las plantillas Astro |
| `pnpm test` | Lógica de actividad, contenido crítico y contraste de la paleta |
| `pnpm build` | Generación del sitio estático |
| `pnpm preview` | Vista local de la compilación |
| `pnpm test:browser` | Tamaños de pantalla, controles, teclado y capturas |
| `pnpm export:pptx` | Regenerar la presentación editable sin construir el sitio |
| `pnpm live` | Construir y ejecutar la web con sesiones efímeras por QR |
| `pnpm serve:live` | Ejecutar el servicio sobre una compilación ya existente |
| `pnpm check:deployment -- https://example.org` | Comprobar recursos, HTTPS y salud del sitio publicado |
| `pnpm test:live:browser` | Probar anfitrión y dos teléfonos simulados, sin abrir puertos |

Para las pruebas de navegador se necesita de tener instalado Chromium para ejecutar `pnpm build` y `pnpm test:browser`. La prueba usa archivos locales, sin servidor ni acceso a internet. Guarda las nuevas capturas y el PDF de comprobación en `test-results/revision-motion/`, sin sobrescribir las capturas anteriores. Esa carpeta no se publica.

## Modo exposición

El índice organiza los temas sin asignarlos a personas. «Cronómetro de exposición · 15 minutos» permite iniciar, pausar, reanudar y reiniciar el tiempo. La ruta «Guión oral» cambia de bloque a los 3:30, 7:00, 10:30 y 14:30, con 30 segundos de margen final. «Con actividad» reserva 12–15 min para participar, con cuatro bloques previos de tres minutos. La actividad de tres minutos no se añade a los 14:30 del Guión original.

El aviso aparece 15 segundos antes de cerrar cada bloque, sin sonido, parpadeo ni avance automático. El tiempo se conserva al cambiar de sección o salir de pantalla completa; recargar la página lo reinicia. La lectura queda visible de forma compacta en modo exposición y en sus controles de pantalla completa.

Activar el **Modo exposición** sirve para ampliar la lectura, reducir notas secundarias y mostrar el avance entre secciones. Los botones anterior y siguiente navegan sin convertir la web en diapositivas. Las fuentes siguen disponibles. El estado desaparece al recargar.

El PPTX se genera automáticamente antes de `pnpm dev` y `pnpm build`, a partir del mismo modelo que la vista PDF. Después de editar contenido mientras el servidor de desarrollo está abierto, ejecuta `pnpm export:pptx` para actualizar la descarga. (aún se debe de mejorar el contenido que se genera con dicha opción)


En **Actividad en grupos**, pulsa «Abrir sesión de 3 min». El QR apunta a `/participar/` en el mismo dominio HTTPS. Los participantes entran sin nombre y completan una valoración inicial de claridad, tres preguntas y una valoración final.

El tiempo total incluye **30 s para entrar, 105 s para responder y 45 s para comentar resultados**. Cada acierto vale un punto, con máximo de tres; la rapidez y la percepción no se puntúan. Al cerrar las respuestas aparecen el promedio del grupo, los aciertos y opciones por pregunta y la distribución de claridad antes/después. Son resultados orientativos de conexiones, no una medición validada de aprendizaje ni una clasificación de personas.

El servicio conserva solo contadores agregados y accesos aleatorios en memoria. Las respuestas individuales se procesan y se descartan; el teléfono mantiene su selección únicamente mientras la página está abierta. Todo se elimina al terminar los tres minutos o al pulsar «Terminar y borrar». Recargar pierde el acceso temporal y permite una conexión nueva; no se intenta reconocer a las personas mediante cookies o huellas del dispositivo.

La **alternativa local** conserva los tres escenarios originales sin puntaje. Cada grupo elige uno, conversa y contrasta la explicación. «Reiniciar» limpia el escenario visible. Sin JavaScript, se pueden desplegar sus explicaciones.

## Servir con Podman

```bash
podman build -t ecosistemas-foticos .
podman run --rm -p 8080:8080 ecosistemas-foticos
```

Abre `http://localhost:8080`. El contenedor final usa Node.js sin privilegios para servir `dist/` y las sesiones en memoria, sin instalar dependencias de aplicación en esa etapa. Para publicar en HTTPS y conectar los teléfonos, consulta [despliegue](docs/deployment.md).

Si necesitas únicamente contenido estático y actividad local, usa `podman build -f Containerfile.static -t ecosistemas-foticos-estatico .`. Esta variante usa Nginx y no admite respuestas compartidas.

## Fuentes

La bibliografía incluye NOAA, SIAC, IDEAM, Parques Nacionales Naturales, Biota Colombiana y EPA. Cada bloque enlaza las fuentes pertinentes. El mapa es ilustrativo, sin escala ni medición de extensión. Consulta [contenido y verificación](docs/content.md) y [origen de recursos](docs/assets.md).

La estructura se explica en [arquitectura](docs/architecture.md). Para proponer cambios, lee [CONTRIBUTING.md](CONTRIBUTING.md). La revisión realizada y los límites del entorno están en [validación](docs/validation.md).


## Despliegue en un servidor

Las plantillas de [deploy/](deploy/README.md) permiten ejecutar el sitio con Podman, systemd y Nginx bajo HTTPS. Configura tu dominio y comprueba el despliegue con `pnpm check:deployment -- https://example.org`. Los certificados y ajustes propios del servidor se gestionan fuera del repositorio.

La exportación pública comienza con una portada de Ecología y la Universidad de Cartagena, sin reparto por integrantes. «PDF con autoría» es una opción protegida y requiere configuración privada del servidor; su preparación está documentada en [despliegue](docs/deployment.md#portada-con-autoría-opcional). Los datos personales y el código de acceso no se incluyen en los archivos públicos.
