# Plantillas de producción

Estos archivos permiten servir la web y la actividad desde un mismo origen HTTPS con Nginx, Podman y systemd. Son plantillas: `example.org` debe sustituirse por el dominio del despliegue. No contienen credenciales ni configuración de una máquina concreta.

## Archivos

| Archivo | Uso |
| --- | --- |
| `cuaderno-de-agua.service` | Servicio systemd; contenedor con proceso sin privilegios, archivos de solo lectura y límites de recursos |
| `cuaderno-de-agua-limits.conf` | Zonas de límites, dentro del contexto `http` de Nginx |
| `cuaderno-de-agua-proxy.conf` | Proxy y controles; se incluye dentro del servidor de este sitio |
| `cuaderno-de-agua-http.conf` | Servidor temporal para obtener el primer certificado |
| `cuaderno-de-agua-https.conf` | Servidor HTTPS y redirección HTTP, cuando el certificado ya existe |
| `renew-nginx.sh` | Hook para validar y recargar Nginx después de renovar el certificado |

El ejemplo publica el contenedor en `127.0.0.1:8082`, con puerto interno 8080. Nginx lo alcanza desde la misma máquina; solo 80 y 443 deben ser públicos. Cambia los puertos si están ocupados y conserva la correspondencia entre servicio y proxy.

## Preparar el servidor

Comprueba las versiones y rutas de Podman, Nginx, systemd y Certbot. Adapta las rutas de los ejecutables si difieren. El DNS debe llegar al servidor y los puertos 80/443 deben estar disponibles según su firewall. Conserva las reglas de administración y los sitios existentes.

Antes de instalar, reemplaza `example.org` en las plantillas por tu dominio, incluido `PUBLIC_ORIGIN` y las rutas de certificados. Guarda los ajustes propios de la máquina fuera del repositorio. Respalda las configuraciones existentes fuera de los directorios que Nginx carga automáticamente. Si ya existe un servidor para ese dominio, actualízalo conservando certificados y directivas necesarias; no crees otro bloque con el mismo nombre.

Desde la raíz del proyecto, construye e instala el servicio:

```bash
sudo podman build --pull=always -t localhost/ecosistemas-foticos:latest -f Containerfile .
sudo install -m 644 deploy/cuaderno-de-agua.service /etc/systemd/system/cuaderno-de-agua.service
sudo systemctl daemon-reload
sudo systemctl enable --now cuaderno-de-agua.service
curl --fail http://127.0.0.1:8082/api/live/health
```

La salud debe informar `available: true`, `persistence: "memory"` y `durationSeconds: 180`. Si no responde, comprueba el estado y los registros de arranque del servicio. Un reinicio elimina las sesiones en curso; evita cambios durante la actividad.

## Instalar Nginx y HTTPS

```bash
sudo install -d -m 755 /etc/nginx/snippets /var/lib/cuaderno-de-agua/acme
sudo install -m 644 deploy/cuaderno-de-agua-proxy.conf /etc/nginx/snippets/cuaderno-de-agua-proxy.conf
sudo install -m 644 deploy/cuaderno-de-agua-limits.conf /etc/nginx/conf.d/cuaderno-de-agua-limits.conf
```

Confirma que `conf.d/*.conf` se carga en el contexto `http`. Si no existe sitio ni certificado para el dominio, instala temporalmente la plantilla HTTP:

```bash
sudo install -m 644 deploy/cuaderno-de-agua-http.conf /etc/nginx/conf.d/cuaderno-de-agua.conf
sudo nginx -t
sudo systemctl reload nginx
sudo certbot certonly --webroot -w /var/lib/cuaderno-de-agua/acme -d example.org
```

Sustituye también el dominio del comando. Recarga solo si la validación pasa. Certbot solicita aceptar sus condiciones y un correo privado para avisos; no lo incorpores al proyecto. La instalación de herramientas depende del sistema del servidor: consulta las [instrucciones oficiales](https://certbot.eff.org/instructions).

Cuando exista el certificado, comprueba sus rutas con `certbot certificates` y adapta la plantilla HTTPS. Instálala en lugar de la plantilla temporal y ejecuta `nginx -t` antes de recargar. Si ya había HTTPS, conserva esa configuración y añade los fragmentos necesarios. No copies HTTP sobre un sitio con TLS ni desactives SELinux; revisa la política local si el proxy o el directorio ACME quedan bloqueados.

La plantilla final permite TLS 1.2/1.3, redirige HTTP y aplica HSTS de un día. El proxy no registra accesos ni errores HTTP que puedan contener IP o códigos de sesión. Sus límites admiten consultas de hasta 300 conexiones por sesión detrás de una misma IP; la creación pública se limita a seis solicitudes por minuto con una ráfaga de dos. Son medidas contra abuso casual, sin autenticación ni garantía frente a ataques.

## Renovación y comprobación

Si el certificado usa el método webroot de esta guía, instala el hook:

```bash
sudo install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy
sudo install -m 755 deploy/renew-nginx.sh /etc/letsencrypt/renewal-hooks/deploy/cuaderno-de-agua-nginx
sudo certbot renew --cert-name example.org --dry-run
sudo systemctl list-timers --all
```

Verifica que Certbot tenga renovación programada y que las rutas del hook coincidan con tu sistema. Si un certificado existente utiliza otro método, conserva y prueba ese método. Gestiona certificados, claves y posibles tokens DNS fuera del repositorio y del contenedor. No uses `curl -k` para la comprobación final.

Desde un equipo con el proyecto y pnpm:

```bash
pnpm check:deployment -- https://example.org
```

Esta prueba solo lee recursos y salud; no crea sesiones. Después ensaya con un portátil y teléfonos reales: abrir por HTTPS, escanear QR, responder, comprobar estadísticas y borrado a los tres minutos. Prueba también desde la red donde se usará y con la concurrencia prevista. Conserva PDF y actividad local como alternativa si falla la conexión.

## Actualizar y volver atrás

Conserva la imagen anterior antes de construir:

```bash
sudo podman tag localhost/ecosistemas-foticos:latest localhost/ecosistemas-foticos:previous
sudo podman build --pull=always -t localhost/ecosistemas-foticos:latest -f Containerfile .
```

Reinicia el servicio solo si la construcción termina correctamente y vuelve a comprobar salud y HTTPS. Si falla, detén el servicio, etiqueta la imagen `previous` como `latest` y vuelve a arrancarlo. Conserva también el respaldo de la configuración del servidor. No hay respuestas persistentes que migrar.

Consulta [despliegue general](../docs/deployment.md), [seguridad](../SECURITY.md) y [validación](../docs/validation.md). Las opciones se apoyan en la documentación oficial de [Podman](https://docs.podman.io/en/stable/markdown/podman-run.1.html), [Nginx](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) y [Certbot](https://eff-certbot.readthedocs.io/en/stable/using.html).

Para personalizar la portada del PDF, consultar la [configuración opcional de autoría](../docs/deployment.md#portada-con-autoría-opcional). El fragmento `private-cover.override.conf` requiere crear primero el secreto y conservar el dominio y puerto del despliegue existente.
