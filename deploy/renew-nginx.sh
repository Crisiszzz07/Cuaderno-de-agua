#!/bin/sh
# Hook de Certbot: recarga solo si la configuracion sigue siendo valida.
set -eu
/usr/sbin/nginx -t
/usr/bin/systemctl reload nginx
