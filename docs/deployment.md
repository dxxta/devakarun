# Production deployment on Dokploy

This guide deploys the dev.akarun app at `https://dev.akarun.site` using Dokploy's
Docker Compose support and the repository's `docker-compose.prod.yml` directly.
The Compose stack contains the standalone Next.js app and a private PostgreSQL
16 service. It keeps uploads in a named volume mounted at `/app/media`.

## 1. Prepare Dokploy and the domain

1. Point the DNS record for `dev.akarun.site` at the VPS running Dokploy.
2. In Dokploy, create a Compose application from this repository and select
   `docker-compose.prod.yml` as its Compose file. Set the variables in the next
   section in the application's Environment tab. Dokploy provides them for
   Compose substitutions; no repository `.env.production` file is required.
3. Configure Dokploy's Traefik domain for `dev.akarun.site`, target the `app`
   service on port `3000`, and enable Let's Encrypt/HTTPS. Force HTTPS after the
   certificate is ready.
4. Keep the `postgres` service internal. It has no published host port; the app
   connects to it using `postgres:5432` on the Compose network.

Dokploy's Environment tab provides Compose substitutions, which the Compose
file forwards to the app and database services. For a manual Compose
deployment, create an untracked `.env.production` and invoke Compose with
`--env-file .env.production` so those substitutions are available.

## 2. Configure environment variables

Set production values in Dokploy. Generate unique secrets; do not use the
examples in `.env.example` as credentials. `DATABASE_URI` must use the Compose
service hostname `postgres`, and its database, username, and password must match
`POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`.

| Variable | Required? | Purpose / production value |
| --- | --- | --- |
| `DATABASE_URI` | Yes | PostgreSQL URL, for example `postgres://akarun:<password>@postgres:5432/akarun`. |
| `POSTGRES_PASSWORD` | Yes | Password for the Compose PostgreSQL user; keep it the same as in `DATABASE_URI`. |
| `POSTGRES_DB` | Optional | PostgreSQL database name; defaults to `akarun`. |
| `POSTGRES_USER` | Optional | PostgreSQL username; defaults to `akarun`. |
| `POSTGRES_PORT` | Dev only | Host port override for `docker-compose.yml`; unused by production Compose. |
| `PAYLOAD_SECRET` | Yes | Random Payload secret of at least 32 characters. |
| `ADMIN_EMAIL` | Yes | Owner's Payload admin login email. |
| `ADMIN_PASSWORD` | Yes | Owner's Payload admin password (at least 12 characters). |
| `NEXT_PUBLIC_SITE_URL` | Yes | Set to `https://dev.akarun.site`. |
| `BLOCK_AI_CRAWLERS` | Optional | Defaults to `true`; set to `false` to disable request blocking for automated AI crawlers. The `robots.txt` rules remain active. |
| `CLOUDFLARE_IMAGES` | Optional | Set to `true` to resize images through Cloudflare (see Cloudflare images below). Unset or `false` keeps the built-in Next.js optimizer. No API token is needed. |
| `SMTP_HOST` | Optional | Outgoing mail server hostname. Leave blank to use the console adapter. |
| `SMTP_PORT` | Optional | SMTP port; commonly `587` with STARTTLS or `465` with TLS. |
| `SMTP_USER` | Optional | SMTP login name, if required by the mail server. |
| `SMTP_PASS` | Optional | SMTP password or app password. |
| `SMTP_FROM` | Optional | Verified sender email address. |
| `CONTACT_TO` | Optional | Owner's address for contact and notification email. |
| `TURNSTILE_SITE_KEY` | Optional | Cloudflare Turnstile public site key. Configure with the secret key. |
| `TURNSTILE_SECRET_KEY` | Optional | Cloudflare Turnstile server-side secret. |
| `AUTH_SECRET` | Optional | Auth.js session secret; set for Google sign-in. |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth client ID; set together with the client secret. |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth client secret. |
| `GITHUB_TOKEN` | Optional | GitHub API token for repository metadata, README files, and demo images; raises the API rate limit. |
| `CRON_SECRET` | Optional | Shared secret for scheduled GitHub project sync requests. |
| `SEED_CONTENT` | Optional | Set to `false` to disable automatic first-boot portfolio seeding. |

The app requires all six variables marked Yes for startup. Add SMTP,
Turnstile, and Google OAuth values when enabling those features. The Docker
image uses non-secret placeholders only while compiling; production runtime
values come from Dokploy.

## Cloudflare images (optional)

Cloudflare can resize and cache images at the edge. It is off unless
`CLOUDFLARE_IMAGES=true` is set in Dokploy's Environment tab (no rebuild needed).

1. Proxy `dev.akarun.site` in Cloudflare DNS (orange cloud) and set SSL/TLS to **Full (strict)**.
2. In Cloudflare, open Images > Transformations and enable it for the zone.
3. Add a Cache Rule that caches `/cdn-cgi/image/*` and `/api/media/file/*` at the edge for a month.
4. Set `CLOUDFLARE_IMAGES=true` and redeploy.

The free plan allows 5,000 unique transformations a month. Once it is used up,
new transformations fail with error 9422 while already cached ones keep working.
The page then falls back to the built-in Next.js optimizer for the rest of that
visit. Its responses carry a one-year cache lifetime, so browsers keep each image
after the first load. Check the edge cache with the `cf-cache-status` response header.

## 3. Apply Payload migrations

Start PostgreSQL and wait for its health check. Before starting the app for a
release that adds schema changes, run the Payload CLI as a one-off container:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm --no-deps app pnpm payload migrate
```

Run this after the `postgres` service is healthy. The one-off app container uses
the same internal Compose network and environment as the web service. The
checked-in migrations are applied automatically on boot. When the
collection schemas change, generate and commit migrations with
`pnpm payload migrate:create` before deploying later schema changes. Do not use
Payload's push/sync mode as a production migration substitute.

## 4. Configure Google OAuth and Turnstile

For Google sign-in, create a Google OAuth web client. Add this exact authorized
redirect URI:

```text
https://dev.akarun.site/api/auth/callback/google
```

Set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and a strong `AUTH_SECRET` in
Dokploy, then redeploy.

In Cloudflare Turnstile, create a widget allowing `dev.akarun.site`. Put its
site key in `TURNSTILE_SITE_KEY` and secret in `TURNSTILE_SECRET_KEY`. Redeploy
after setting both.

## 5. Configure the own mail server

When using the owner's SMTP server, set the `SMTP_*` and `CONTACT_TO` values and
verify delivery. Configure DNS for the sending domain before relying on
transactional email:

- **SPF:** publish one SPF TXT record authorizing the outbound mail server.
- **DKIM:** publish the selector TXT/CNAME records supplied by the mail server
  and confirm outbound messages carry a valid signature.
- **DMARC:** publish a `_dmarc` TXT policy with reporting addresses; start with
  monitoring (`p=none`), review reports, then tighten the policy as appropriate.
- Check forward and reverse DNS, TLS certificates, and that the SMTP envelope
  sender aligns with the verified `SMTP_FROM` domain.
- Send test contact and notification messages and inspect authentication
  results in the received message headers.

## 6. GitHub-backed projects and scheduled sync

On first boot, the app seeds the seven resume projects plus Slipakar and
Notakar. Byecheating, FundConn, and ColorSorter are linked to GitHub with their
resume text protected; Slipakar's title is protected while its other project
details come from its repository. Notakar is linked to GitHub and starts
unhighlighted. All five GitHub-backed projects sync repository metadata,
language, topics, and optional
`docs/demos/` images. To add another project, open `/admin`, create a project, set Source to
`github`, enter `owner/name` in GitHub repo, and click "Sync from GitHub".
Screenshots in `docs/demos/` can be PNG, JPG/JPEG, WebP, or GIF; the first image
alphabetically becomes the cover and remaining images become the gallery. Set
`GITHUB_TOKEN` to raise GitHub's API rate limit.

The `/api/github-sync` handler supports scheduled refreshes. Create a daily job
(for example, `17 3 * * *` UTC) that sends:

```sh
curl --fail --silent --show-error --request POST \
  --header "x-cron-secret: ${CRON_SECRET}" \
  https://dev.akarun.site/api/github-sync
```

Store the secret in the scheduler's secret store and set the matching
`CRON_SECRET` in Dokploy. The endpoint is available once the GitHub sync implementation is deployed; the
cron should be enabled after that release.

## Backups and restore

Back up both named volumes regularly:

- `postgres_data` contains the PostgreSQL database.
- `media_data`, mounted at `/app/media`, contains uploaded media.

Run `scripts/backup.sh` from the repository checkout on the deployment host. It
creates a timestamped SQL dump and a compressed tar archive under `./backups/`.
Copy those files off the VPS and protect them as production data.

To restore, first stop the app to prevent writes. Restore the SQL dump into the
database:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < backups/postgres-<timestamp>.sql
```

Restore media with a one-off container that mounts the same volume:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm --no-deps --entrypoint sh app \
  -c 'tar -xzf - -C /app/media' \
  < backups/media-<timestamp>.tar.gz
```

Restart the app after both restores complete. Validate `/api/health`, the admin,
and representative media URLs.

## First-deploy checklist

On first boot in development and production, after the admin account is seeded,
the app automatically seeds the portfolio when Tech Stack is empty and the
Profile global has no name. This includes the profile, 28 technologies, 16
certificates and images, nine projects (five GitHub-backed), eight showcase
pages, and the merged portfolio PDF; startup then syncs GitHub project data.
Set `SEED_CONTENT=false` to disable the first-boot seed. Existing content is
not overwritten on later boots; edit it in `/admin`. To intentionally
reapply the portfolio upsert, run `pnpm payload run src/seed/run.ts`. Blog sample
content is manual only and is not part of startup seeding.

- [ ] DNS for `dev.akarun.site` points to the Dokploy VPS.
- [ ] Dokploy uses `docker-compose.prod.yml` and all required values are set in
      the application's Environment tab.
- [ ] `DATABASE_URI` points to `postgres:5432` and matches the PostgreSQL
      database/user/password settings.
- [ ] PostgreSQL reports healthy and the initial Payload migration has run.
- [ ] Traefik routes port 3000 and HTTPS is active.
- [ ] `https://dev.akarun.site/api/health` returns `{"status":"ok"}`.
- [ ] Owner can sign in at `/admin` with the seeded admin credentials.
- [ ] The owner's profile, projects, tech stack, certificates, and certificate
      images appear after the first boot (unless `SEED_CONTENT=false` is set).
- [ ] Google OAuth and Turnstile work if enabled.
- [ ] SMTP, SPF, DKIM, and DMARC have been verified if email is enabled.
- [ ] Both database and media backups have been created and copied off-host.
- [ ] Enable the scheduled sync only after the GitHub sync endpoint is deployed.
