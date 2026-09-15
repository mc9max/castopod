# Castopod

Self-hosted podcast hosting platform for creators who want to own their data. Upload episodes, manage your show notes, publish to the Fediverse, and get analytics — no ad trackers, no SaaS lock-in.

Two services: Castopod (web app) + MariaDB (database).

## Deploy and Host

Host your own Castopod on Railway. This template provisions the all-in-one Castopod container (FrankenPHP + Caddy + s6-overlay under the hood) and a MariaDB companion for persistence. Podcast audio/artwork and app state persist in a Railway volume at `/app/public/media`.

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.com/deploy/nAUhyE)

## Why Deploy

Castopod is the open-source backend that powers the Castopod service used by podcasters. Running it on Railway gives you a durable, auto-updating, globally reachable instance with:

- **Full data ownership** — audio, artwork, and DB live on your Railway volume.
- **ActivityPub fediverse support** — engage with the fediverse from your own instance.
- **REST API** — publish episodes programmatically (see the Castopod plugin ecosystem).
- **Two-factor auth** — TOTP built in (enabled by default).
- **No ad stack** — plain self-hosted software, your analytics.

## Common Use Cases

- **Solo podcasters** who want to move away from SaaS and own their episode archive
- **Fediverse-engaged shows** — republish to the fediverse from one control panel
- **API-first producers** — drive uploads from your editor or a custom pipeline
- **Community hosts** — offer your members a private Castopod instance

### Deployment Dependencies

The deploy form pre-fills all companion variables (DB host / name / user / password are wired to the MariaDB service via private-domain references — nothing to type).

**After the first successful deploy:**

1. Open the service's public URL — you'll be redirected to `/cp-setup` (or `/cp-install` on some builds)
2. Complete the setup wizard — set your instance name, admin email, and admin password
3. You are now the first (and by default the only) admin user

No OAuth app, no external service, no key-pair registration — the app ships with what it needs.

## Architecture

- **Castopod (all-in-one)** — runs FrankenPHP + Caddy under s6-overlay. Three s6 services: `bootstrap` (renders `/app/.env` from the `CP_*` variables and runs migrations), `frankenphp` (serves the web app on `:8080`, health at `/health`), and `supercronic` (cron for background jobs incl. queue drain). Persists to `/app/public/media`.
- **MariaDB 12.1** — database companion. Persists to `/var/lib/mysql` (volume). Castopod connects over the Railway private network using the companion-mapping references.

Redis is **not required** — Castopod defaults to `file` cache and the supercronic service handles periodic jobs. To add Redis later, deploy a separate Redis service and set `CP_REDIS_HOST` / `CP_REDIS_PASSWORD`.

## Features

- **Episode & person management** — upload, edit, publish, unpublish, and reorder episodes
- **REST API v1** — drive Castopod from scripts or editors
- **ActivityPub** — native fediverse engagement (needs TLS — Railway provides it)
- **Two-factor authentication** — TOTP, enabled by default
- **Web dashboard** — plain PHP/CodeIgniter stack, no build step
- **Analytics** — episode plays, uniques, geo distribution (opt in with `CP_ANALYTICS_SALT`)
- **Custom domain support** — set `CP_BASEURL` to your custom domain after deploy

## Dependencies for

This is a two-service template:

| Service | Image | Version | Role |
|---------|-------|---------|------|
| `castopod` | `castopod/castopod` | `1.15.5` | All-in-one web + s6 (bootstrap / frankenphp / supercronic) |
| `mariadb` | `mariadb` | `12.1` | MySQL-compatible database companion |

## About Hosting

- **Castopod service** — web front-end on port 8080, health at `/health`. The s6 `bootstrap` one-shot runs `php spark castopod:database-update` (migrations) and `php spark cache:clear` before `frankenphp` starts. `/app/public/media` must be writable by the pod — running as root (uid 0) with the root-owned volume is the pattern that works on Railway.
- **MariaDB service** — `:3306`, `CASTOPOD_USER`/`CASTOPOD_PASSWORD` credentials are injected by the template. The `mariadb` image's own entrypoint handles volume-owning (no wrapper needed).

**Volume sizing:** For a personal show, a 20 GB Railway volume is plenty. For a multi-year archive, size to your expected audio size (roughly 45 MB/min for a 64 kbps stereo mp3, so a 1-hour episode is about 90 MB).

## Configuration

All variables shown in the deploy form are pre-wired; the only two you may want to override are the DB credentials (already auto-generated) and the optional SMTP / media-domain block.

| Variable | Required | Description |
|----------|----------|-------------|
| `CP_BASEURL` | Yes | Public URL of this service (trailing slash). Auto-filled from the public domain. |
| `CP_ANALYTICS_SALT` | Yes | 64-char random string for analytics hashing. Auto-generated. |
| `RAILWAY_RUN_UID` | Yes | Must be `0` (root) so the root-owned volume is writable by the s6 services. |
| `CP_DATABASE_HOSTNAME` | No | Default: `${{mariadb.RAILWAY_PRIVATE_DOMAIN}}` |
| `CP_DATABASE_NAME` | No | Default: `${{mariadb.MYSQL_DATABASE}}` |
| `CP_DATABASE_USERNAME` | No | Default: `${{mariadb.MYSQL_USER}}` |
| `CP_DATABASE_PASSWORD` | No | Default: `${{mariadb.MYSQL_PASSWORD}}` |
| `CP_MEDIA_BASEURL` | No | Separate domain for media (e.g. S3 or CDN). Leave empty to use `CP_BASEURL`. |
| `CP_ENABLE_2FA` | No | `true`/`false`. Default `true`. |
| `CP_EMAIL_FROM` | No | SMTP From address. |
| `CP_EMAIL_SMTP_HOST` | No | SMTP host. |
| `CP_EMAIL_SMTP_USERNAME` | No | SMTP user. |
| `CP_EMAIL_SMTP_PASSWORD` | No | SMTP password. |

## Quick Start

1. Deploy via the button above.
2. Wait ~90 seconds for both services to reach `Running`.
3. Open the Castopod public URL → redirected to the setup wizard.
4. Complete setup (instance name, admin email, admin password).
5. Create your first podcast, upload your first episode, done.

## License

Castopod is open source under AGPL-3.0.
