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

4. Con la caché antigua aún activa, cargar la aplicación en un navegador y
   comprobar que el *Service Worker* actualiza los recursos:

   - En la consola, ejecutar `caches.keys()` y verificar que sólo existen
     `static-${APP_VERSION}-v${CACHE_VERSION}` y
     `api-${APP_VERSION}-v${CACHE_VERSION}`.
   - Revisar la pestaña *Network* y confirmar que todos los assets provienen de
     la nueva versión desplegada.

## Rollback

Ejecutar `bash scripts/rollback.sh <VERSION>` para que el alias `current` vuelva a apuntar a la versión deseada.

## Monitorización de rutas obsoletas

- El archivo `/var/log/nginx/legacy.log` registra accesos a rutas antiguas como `/dist/`.
- El archivo `/var/log/nginx/404.log` captura todas las respuestas 404.
- Una tarea programada (`scripts/legacy-cleanup.cron`) ejecuta mensualmente `scripts/legacy-cleanup.sh` para revisar estos logs y eliminar rewrites que cumplan el criterio de retiro.
- El criterio de retiro: menos de 5 accesos por semana durante cuatro semanas consecutivas o fecha tope **30/06/2025**.
- Documentar el plan de retiro en este runbook o en un issue del repositorio cuando los accesos sean insignificantes.
