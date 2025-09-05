# Runbook de despliegue

## Despliegue

1. Generar los artefactos necesarios.
2. Ejecutar `bash scripts/deploy.sh [VERSION]`.
   - Copia los archivos a `releases/[VERSION]` dentro de `/var/www/gw2/static`.
   - Actualiza el alias `current` para apuntar a la nueva versión.
   - Elimina los despliegues antiguos con `ls -1t releases | tail -n +3 | xargs rm -rf`.
   - Purga la caché del CDN.

3. Verificar que el CDN respeta las cabeceras `Cache-Control` enviadas por el
   origen. Asegúrate de no tener reglas en el CDN que las sobrescriban.

   - `/static/current/*` debe responder con `Cache-Control: no-cache, must-revalidate`.
   - `/static/<VERSIÓN>/*` debe responder con `Cache-Control: public, max-age=31536000, immutable`.

   Puedes comprobarlo con herramientas del CDN o con `curl`:

   ```bash
   curl -I -H 'Cache-Control: max-age=0' https://<dominio>/static/current/app.js
   curl -I -H 'Cache-Control: max-age=0' https://<dominio>/static/123/app.js
   ```

   Ambas respuestas deben incluir las cabeceras mencionadas.

## Rollback

Ejecutar `bash scripts/rollback.sh <VERSION>` para que el alias `current` vuelva a apuntar a la versión deseada.
