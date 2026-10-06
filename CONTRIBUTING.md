# Proponer cambios

Puedes proponer una corrección científica, mejorar una explicación o ajustar el diseño. Describe el problema concreto, qué cambia y cómo lo comprobaste.

Para cambiar contenido:

1. Aporta una fuente pública, preferiblemente institucional o un trabajo científico original.
2. Indica el apartado o página que respalda la afirmación y su fecha. Evita trasladar conclusiones de otro lugar a toda Colombia.
3. Edita `src/infrastructure/` y registra la referencia. Mantén nombres científicos en cursiva y evita cifras o categorías sin contexto.
4. Actualiza `docs/content.md` si cambian el alcance o las fuentes.

Para cambiar diseño, conserva navegación por teclado, controles nativos, foco visible y alternativas textuales. Revisa móvil, tableta, portátil y proyector. Las animaciones educativas deben ser suaves, pausables y respetar movimiento reducido; evita movimiento distractor, paquetes sin uso e imágenes con licencia incierta. Registra cualquier recurso nuevo en `docs/assets.md`.

Antes de proponer el cambio:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Ejecuta `pnpm test:browser` si cambias interacción o composición y cuentas con Chromium. Incluye lo que pasó, lo que no pudiste comprobar y, si ayudan, capturas sin datos personales. No incluyas archivos `.env`, credenciales, nombres de integrantes ni documentos privados. La licencia del repositorio sigue pendiente de decisión de su propietario.

Si cambias la actividad conectada, verifica también `pnpm test:live:browser` y las pruebas de sesión/HTTP. Conserva el límite de tres minutos, el descarte automático, los reintentos sin votos duplicados y la distinción entre aciertos y percepción. No añadas registros de usuarios, cookies, huellas del dispositivo o persistencia para reconocer a las personas.
