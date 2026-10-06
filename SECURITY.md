# Seguridad y privacidad

La [configuración para la VM](deploy/README.md) limita el puerto de la aplicación a loopback y deja HTTPS a Nginx. Ejecuta el contenedor como `node`, con código de solo lectura, sin capacidades adicionales ni escalamiento de privilegios, y limita memoria, CPU y procesos. `PUBLIC_ORIGIN` exige el origen HTTPS configurado en las mutaciones. El proxy no conserva registros HTTP de este sitio y limita solicitudes con un margen para el Wi-Fi compartido del aula. Certificados y claves se gestionan fuera del proyecto.

Las sesiones se crean públicamente. Los límites de solicitudes y capacidad reducen abuso, pero no autentican personas ni garantizan disponibilidad frente a un ataque.

El contenido educativo se construye como sitio estático. La actividad por QR añade un servicio efímero, sin base de datos, cuentas, analítica, cookies ni almacenamiento persistente. No se solicitan nombres, correos ni identificadores de dispositivos. No se requieren secretos ni credenciales externas en el repositorio.

El servicio procesa respuestas y valoraciones para incrementar contadores del grupo; descarta las respuestas individuales y no conserva sus puntajes individuales. Solo retiene contadores agregados y accesos aleatorios en RAM durante la sesión. El indicador «ya envió» permite reintentos sin duplicar votos. Los accesos de participante y anfitrión se generan al abrir la sesión y viven exclusivamente en memoria, no en archivos ni variables de entorno.

El límite total es de 180 segundos. Las rutas dejan de aceptar respuestas a los 135 segundos y descartan sesiones vencidas al consultarlas; una limpieza cada segundo elimina también las que nadie consulta. «Terminar y borrar» las descarta antes. Reiniciar el servicio elimina todas las sesiones. No se crean copias, historiales o exportaciones de resultados. Los navegadores descartan también su estado temporal al finalizar; recargar la página pierde ese estado.

La API limita el cuerpo de solicitudes y la cantidad de sesiones y conexiones en memoria; rechaza opciones desconocidas y datos adicionales. El control de cierre exige el acceso aleatorio de quien creó la sesión. El sitio debe publicarse bajo HTTPS para proteger estos accesos durante el transporte. La encuesta cuenta conexiones, no personas verificadas: una recarga puede crear una conexión nueva. No es un sistema de examen ni de identidad.

Las fuentes científicas son enlaces a sitios externos. Al visitarlos se aplican las políticas de esos sitios. El servicio no registra solicitudes, direcciones IP ni cuerpos de respuesta; solo anuncia el puerto de inicio. En la variante estática, el registro de acceso de Nginx está desactivado. Un proxy o alojamiento externo puede generar sus propios registros; su responsable debe configurarlos y decidir su retención.

Para informar una vulnerabilidad, usa el mecanismo privado de reporte de seguridad del repositorio, si su alojamiento lo ofrece. Si no está habilitado, solicita en un issue únicamente un canal privado, sin describir cómo explotar el problema ni adjuntar datos sensibles.

IMPORTANTE: Revisar que no se publiquen accesos de sesiones, credenciales, archivos privados, registros con información personal ni pruebas contra visitantes reales. Un reporte útil explica el componente afectado, el impacto y una reproducción mínima y segura. Las correcciones deben conservar el funcionamiento editorial estático, la ausencia de secretos y el descarte automático de sesiones.
