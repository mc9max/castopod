import { defineRailway, github, image, preserve, project, service, volume } from "railway/iac";

// Castopod — self-hosted podcast hosting (2 services, one repo).
//
//   castopod/  stock `castopod/castopod:1.15.5` (FrankenPHP+Caddy+s6). Railway
//              volumes mount root-owned and the stock image runs as www-data,
//              so RAILWAY_RUN_UID=0 boots it cleanly. Media lives on a volume.
//   mariadb/   `mariadb:12.1` — credentials are generated here and referenced
//              by the castopod service below.
//
// Cross-service wiring uses Railway's dynamic env refs (service.VAR) so fresh
// installs get consistent, auto-generated values — no hardcoded credentials.
// Secrets use preserve() so re-applying never clobbers generated values.

const castopodRepo = github("mc9max/castopod", { branch: "master", checkSuites: false });

const mediaVolume = volume("castopod-media", {
  alerts: { usage: { "80": {}, "95": {} } },
  allowOnlineResize: true,
  region: "us-west2",
  sizeMB: 10240,
});

const dbVolume = volume("castopod-db", {
  alerts: { usage: { "80": {}, "95": {} } },
  allowOnlineResize: true,
  region: "us-west2",
  sizeMB: 2048,
});

const mariadb = service("mariadb", {
  source: image("mariadb:12.1"),
  replicas: { "us-west2": 1 },
  volumeMounts: { "/var/lib/mysql": dbVolume },
  env: {
    MYSQL_DATABASE: "castopod",
    MYSQL_USER: "castopod",
    MYSQL_PASSWORD: preserve(),
    MYSQL_ROOT_PASSWORD: preserve(),
  },
});

const castopod = service("castopod", {
  source: image("castopod/castopod:1.15.5"),
  deploy: { healthcheckPath: "/health" },
  replicas: { "us-west2": 1 },
  volumeMounts: { "/app/public/media": mediaVolume },
  env: {
    CP_BASEURL: preserve(),
    CP_ANALYTICS_SALT: preserve(),
    // Railway volumes mount root-owned; stock image defaults to www-data.
    RAILWAY_RUN_UID: "0",
    CP_DATABASE_HOSTNAME: preserve(),
    CP_DATABASE_NAME: preserve(),
    CP_DATABASE_USERNAME: preserve(),
    CP_DATABASE_PASSWORD: preserve(),
    CP_ENABLE_2FA: "true",
  },
});

return project("castopod", {
  resources: [castopod, mariadb],
});
