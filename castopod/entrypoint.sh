#!/bin/sh
set -e

# Wait for the database to accept TCP connections before the stock Castopod
# s6 bootstrap runs `castopod:database-update`. On Railway the web service
# and MariaDB start in parallel (no health-gated ordering), so without this
# wait the bootstrap can crash on the very first boot.
DB_HOST="${CP_DATABASE_HOSTNAME:-mariadb}"
DB_PORT="${CP_DATABASE_PORT:-3306}"

echo "[entrypoint] waiting for database at ${DB_HOST}:${DB_PORT} ..."
i=0
while ! php -r "\$e=\$w=null; exit(@fsockopen('${DB_HOST}','${DB_PORT}',\$e,\$w,2)?0:1);"; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "[entrypoint] database ${DB_HOST}:${DB_PORT} not ready after 120s — continuing anyway (Castopod will retry on reload)" >&2
    break
  fi
  sleep 2
done
echo "[entrypoint] database reachable, proceeding with bootstrap"

# Hand off to the stock serversideup entrypoint, which runs the s6-overlay
# services (bootstrap → frankenphp → supercronic).
exec docker-php-serversideup-entrypoint /init
