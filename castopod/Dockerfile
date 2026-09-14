# Castopod — self-hosted podcast hosting platform
#
# Base image is all-in-one: FrankenPHP (Caddy) under s6-overlay, running
#   bootstrap (one-shot: render .env from CP_* vars + DB migrations)
#   frankenphp  (longrun: web, :8080/health)
#   supercronic (longrun: cron / background jobs)
#
# Railway mounts /app/public/media as a root-owned volume. The s6 services
# have no per-service `user` file, so they inherit the container user. The
# stock image runs as www-data (uid 33), which CANNOT write a root-owned
# Railway volume → the bootstrap fails with EACCES. Running as root fixes
# that without touching the image. (MariaDB manages its own volume.)
#
# We wrap the entrypoint to WAIT for MariaDB before the stock s6 bootstrap
# tries `castopod:database-update` (Railway has no health-gated service
# ordering, so the web service can otherwise start before the DB is ready).
#
# Reference: https://docs.castopod.org/main/en/getting-started/docker/
FROM castopod/castopod:1.15.5

USER root

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -sf http://localhost:8080/health || exit 1

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
