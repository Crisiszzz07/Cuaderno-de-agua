# Construir y publicar

Las [plantillas de producción](../deploy/README.md) incluyen systemd, Nginx, HTTPS y restricciones del contenedor. Sustituye el dominio de ejemplo por el tuyo y adapta los puertos a tu servidor. Los ejemplos siguientes sirven para ejecución local y despliegues generales.

El sitio genera HTML, CSS, JavaScript compilado y SVG. La lectura y la actividad local funcionan como contenido estático. Para reunir respuestas de teléfonos por QR se necesita también el servicio de sesiones en memoria. No utiliza base de datos ni secretos. No se instala un servicio de caché offline.

## Construcción local

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

La vista previa abre el puerto 4321 y sirve únicamente contenido estático. `dist/` incluye `/exposicion/`, `/participar/` y la descarga PPTX. El build regenera el PPTX antes de compilar Astro. Para una subruta hay que adaptar `base` y los enlaces de recursos y de la actividad.

Para probar web y actividad conectada juntas:

```bash
pnpm live
```

O, después de construir, ejecuta `pnpm serve:live`. Se abre el puerto 8080. `PORT` es una opción no secreta para cambiarlo; no hace falta un archivo `.env`. `localhost` solo identifica el dispositivo que abre la dirección. El QR toma el origen desde el que se abre la web; la participación desde otros dispositivos requiere una dirección accesible para todos.

Si el arranque informa `EADDRINUSE`, otro proceso ocupa el puerto. Puedes usar otro sin detener ese proceso:

```bash
PORT=8081 pnpm serve:live
```

Abre entonces `http://localhost:8081`. Con Podman cambia el puerto publicado: `podman run --rm -p 8081:8080 ecosistemas-foticos`.

Si informa `EPERM` o `EACCES`, el sistema denegó la apertura del servidor; un puerto diferente no garantiza resolverlo. Ejecuta el servicio en una terminal o servidor que permita escuchar conexiones. Para una prueba accesible únicamente desde tu equipo puedes usar `HOST=127.0.0.1 PORT=8081 pnpm serve:live`. `HOST` es opcional; por defecto escucha en `0.0.0.0` para permitir el acceso desde el contenedor y el proxy. No uses `HOST=127.0.0.1` dentro del contenedor que publica el puerto.

## Contenedor con Podman

```bash
podman build -t ecosistemas-foticos .
podman run --rm -p 8080:8080 ecosistemas-foticos
```

Visita `http://localhost:8080`. Puedes comprobar la respuesta con:

```bash
curl -I http://localhost:8080/
```

El `Containerfile` tiene dos etapas. La primera usa Node.js 24 Alpine, activa pnpm 10.33.2, instala con el lockfile y compila. La segunda sirve `dist/` y la API efímera con Node.js 24, como usuario `node`, sin privilegios. Copia solo el adaptador HTTP y los módulos que necesita: no lleva `node_modules`, herramientas de desarrollo, documentos privados, pruebas o credenciales. El TypeScript del servicio se ejecuta de forma nativa.

Node usa la rama 24 mantenida. Para un despliegue reproducible a nivel de imagen, el responsable puede fijar sus digest después de comprobarlos en el registro. El lockfile fija las dependencias del proyecto.

`.containerignore` excluye Git, paquetes locales, documentos de trabajo, pruebas, credenciales y variables de entorno. La landing no es una SPA: los archivos inexistentes devuelven 404. La API usa `/api/live/` en el mismo origen que la página.

La política de contenido permite únicamente recursos y conexiones del mismo sitio. Los estilos en línea se permiten porque algunos gráficos usan posiciones CSS calculadas; los scripts son módulos propios. La API envía cabeceras `no-store` y no crea cookies. El servicio no registra accesos, direcciones IP, respuestas o accesos temporales. Un proxy o proveedor puede mantener registros propios: configura su retención y evita registrar las solicitudes de actividad.

## Publicar con HTTPS para los teléfonos

Todos deben abrir el mismo dominio público HTTPS. El QR se genera localmente con esa dirección, no con una dirección configurada en una imagen externa. Publicar solo `dist/` en un alojamiento estático no permite agregar respuestas del grupo.

Coloca un proxy con TLS delante del puerto 8080 y envía tanto la web como `/api/live/` a la misma instancia. Dentro de un servidor HTTPS de Nginx ya configurado por quien administra el dominio, el bloque de proxy puede ser:

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-Proto $scheme;
    access_log off;
}
```

Conserva la cabecera `Host` original: el servicio comprueba que las mutaciones vienen del mismo sitio. No caches rutas de API. Los certificados se gestionan fuera del repositorio y del contenedor. No se necesitan claves de servicios externos.

En producción, puedes limitar el puerto del contenedor al proxy local con `-p 127.0.0.1:8080:8080`. Usa una sola instancia mientras se desarrolla la exposición; la memoria no se comparte entre réplicas. No reinicies ni reemplaces el contenedor durante una sesión: hacerlo la elimina, que es el comportamiento esperado sin persistencia.

## Variante puramente estática

```bash
podman build -f Containerfile.static -t ecosistemas-foticos-estatico .
podman run --rm -p 8080:8080 ecosistemas-foticos-estatico
```

Esta variante conserva Nginx sin privilegios, puerto 8080 y el archivo pequeño `nginx.conf`. Permite lectura, exposición, exportaciones y actividad local. Si se intenta abrir una sesión QR, la página explica que ese alojamiento no tiene disponible la actividad en vivo.

## Mantenerlo en ejecución

Para una máquina con Podman configurado y permiso de publicar el puerto:

```bash
podman run -d --name ecosistemas-foticos -p 8080:8080 ecosistemas-foticos
podman logs ecosistemas-foticos
podman stop ecosistemas-foticos
podman rm ecosistemas-foticos
```

Este comando no hace público el sitio automáticamente. Para acceso desde internet se necesita un servidor accesible, su configuración de red y un dominio o dirección pública. Termina HTTPS en un proxy delante del puerto 8080. No añadas certificados privados o claves al repositorio ni a la imagen.

Para actualizarlo, vuelve a construir la imagen y reemplaza el contenedor. No hay datos de aplicación que migrar. La configuración por sí sola no publica el sitio: comprueba el despliegue y la actividad desde dispositivos externos.

## Diagnóstico

`EADDRINUSE` indica que el puerto está ocupado; `PORT` permite seleccionar otro. `EPERM` o `EACCES` indican que el sistema deniega la apertura del servidor. Podman necesita permisos para gestionar contenedores y escribir su estado de ejecución; esas condiciones dependen del sistema donde se instala.

Una respuesta `502` del proxy requiere comprobar primero la salud del servicio en loopback y luego las reglas de red y la política de SELinux. No se debe desactivar SELinux para resolver un problema del proxy. Antes de recargar Nginx, ejecutar `nginx -t`.

Los criterios de revisión funcional y de despliegue están en [validación](validation.md).

## Portada con autoría, opcional

La portada general del PDF y del PPTX contiene el tema, Ecología y la Universidad de Cartagena. La opción «PDF con autoría» permite imprimir una portada personalizada después de validar un código por HTTPS. La versión estática conserva la portada general; la personalización requiere el servicio Node.

Para preparar datos privados en una terminal de desarrollo:

```bash
pnpm configure:cover
```

El comando pide el código sin mostrarlo y solicita integrantes, universidad y semestre. Guarda un hash con sal y los datos en `.local/private-cover.json`, con permisos de lectura y escritura únicamente para su propietario. La carpeta está excluida de Git y del contexto del contenedor. El archivo no debe publicarse ni incluirse en una imagen.

En la VM, transferir el archivo por un canal privado y crear un secreto de Podman usando el mismo usuario que administra el servicio:

```bash
podman secret create cuaderno-private-cover /RUTA/PRIVADA/private-cover.json
```

La plantilla `deploy/private-cover.override.conf` permite montar ese secreto en `/app/runtime-secrets/private-cover.json` y definir `PRIVATE_COVER_FILE`. Se instala como fragmento de systemd, adaptando dominio y puerto al servicio existente. Es necesario reconstruir la imagen actual antes de activarla: el Containerfile prepara el punto de montaje dentro del contenedor de solo lectura. Los datos no se copian durante el build. La personalización es opcional; sin el secreto, el sitio y la actividad funcionan y la portada general sigue disponible.

La API exige el origen HTTPS configurado y limita la validación a cinco solicitudes por minuto para toda la instancia, además del límite del proxy. El código no se envía en direcciones URL ni se devuelve al navegador. Nombres y semestre se entregan solo tras validarlo, sin cookies ni caché, y se retiran de la página después de imprimir. El PDF guardado contiene esa autoría y puede ser compartido por quien lo descarga: la protección controla el acceso a la generación, no la redistribución del archivo.

Un identificador académico no ofrece la misma resistencia que un secreto aleatorio largo. El administrador puede cambiar el código mediante una nueva configuración privada y reemplazar el secreto fuera del repositorio.
