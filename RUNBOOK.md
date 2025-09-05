# Runbook de despliegue

## Despliegue

1. Generar los artefactos necesarios.
2. Ejecutar `bash scripts/deploy.sh [VERSION]`.
   - Copia los archivos a `releases/[VERSION]` dentro de `/var/www/gw2/static`.
   - Actualiza el alias `current` para apuntar a la nueva versión.
   - Elimina los despliegues antiguos con `ls -1t releases | tail -n +3 | xargs rm -rf`.
   - Purga la caché del CDN.

## Rollback

Ejecutar `bash scripts/rollback.sh <VERSION>` para que el alias `current` vuelva a apuntar a la versión deseada.
