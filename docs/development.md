# Local development

## Requirements
- Node.js 22+ (`node -v`)
- pnpm 9+ (`corepack enable` or `npm i -g pnpm`)
- Docker (for the local PostgreSQL)

## 1. First-time setup

```bash
pnpm install
cp .env.example .env
```

Edit `.env`. Minimum values:

| Variable | Local value |
|---|---|
| `DATABASE_URI` | `postgres://akarun:akarun@localhost:5432/akarun` (use the port from step 2) |
| `PAYLOAD_SECRET` | any random string of 32+ characters: `openssl rand -hex 24` |
| `ADMIN_EMAIL` | the email you will log in with |
| `ADMIN_PASSWORD` | 12+ characters |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

Everything else (SMTP, Turnstile, Google, GitHub) is optional locally:
- No SMTP: emails are printed in the terminal running `pnpm dev`.
- No Turnstile keys: Cloudflare's always-pass test keys are used.
- No Google keys: the comment form shows a sign-in button that cannot complete; see "Google sign-in" below.

## 2. Start the database

```bash
docker compose up -d postgres
```

If port 5432 is already used by another project, set `POSTGRES_PORT=55439` in your shell or `.env`, then use `postgres://akarun:akarun@localhost:55439/akarun` as `DATABASE_URI`.

## 3. Run the app

```bash
pnpm dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin, log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The admin account is created (or its password updated) from `.env` every time the app starts. Registration is disabled.
- In dev, the database schema is pushed automatically when you change a collection.

## 4. About page content

On first app boot, the portfolio content is seeded automatically in development
and production when the Tech Stack collection is empty and the Profile global
has no name. The seed creates the profile, 28 technologies, 16 certificates
with their certificate images, nine projects, eight showcase pages, and the
merged portfolio PDF. Byecheating, FundConn, ColorSorter, Slipakar, and Notakar
are GitHub-backed; the app syncs their repo data while retaining resume copy
for the three linked resume projects. `SEED_CONTENT=false` disables this
first-boot seed.
Afterward, make content changes in `/admin`; existing content is not overwritten
on later boots. Blog sample content remains manual only.

To intentionally reapply the portfolio seed after editing the seed source, run
the manual upsert:

```bash
pnpm payload run src/seed/run.ts
```

The portfolio seed is idempotent and upserts the profile, technologies,
certificates, projects, showcase pages, and portfolio PDF. Run the GitHub sync
endpoint to refresh repository data after a manual seed. Blog content has a separate manual seed:

```bash
pnpm payload run src/seed/run-blog.ts
```

It creates the starter categories, tags, and posts. This command is the only way
to add the sample blog content.

## Everyday commands

| Purpose | Command |
|---|---|
| Type check | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Integration tests (needs Postgres running) | `pnpm test:int` |
| End-to-end tests (Playwright, starts its own dev server) | `pnpm test:e2e` |
| Regenerate Payload types after changing a collection | `pnpm generate:types` |
| Regenerate admin import map after adding admin components | `pnpm generate:importmap` |
| Production build | `pnpm build` then `pnpm start` |
| Add a shadcn component | `pnpm dlx shadcn@latest add <name>` |

Install Playwright browsers once before the first e2e run: `pnpm exec playwright install`.

## Where things live

```
src/app/(frontend)/   public site (About, blog, search drawer, contact, newsletter)
src/app/(payload)/    Payload admin and API
src/app/api/          health, GitHub sync, Auth.js routes
src/collections/      Payload collections (portfolio.ts, blog.ts, engagement.ts register them)
src/globals/          SiteSettings, Profile
src/components/       site components; ui/ holds shadcn components
src/lib/              env validation, Turnstile, rate limit, email, GitHub client
src/seed/             seed scripts
src/migrations/       database migrations (used in production)
tests/int, tests/e2e  Vitest and Playwright tests
```

## Changing the database schema

1. Edit the collection or global.
2. Run `pnpm generate:types`.
3. Before deploying, create a migration: `pnpm payload migrate:create <name>`. Production applies migrations automatically on start.

## Optional features locally

**Google sign-in (comments).** Create an OAuth client in Google Cloud Console with redirect URI `http://localhost:3000/api/auth/callback/google`, then set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` and `AUTH_SECRET` (`openssl rand -hex 32`) in `.env` and restart `pnpm dev`. Approve comments in `/admin` under Comments (they start as `pending`).

**GitHub projects.** On first app boot, Byecheating, FundConn, and ColorSorter
are linked to GitHub while retaining their resume title, summary, and
description. Slipakar is added as a GitHub project whose title, summary, and
description sync from its repository. The default repositories are
`dxxta/slipakar`, `dxxta/fundconn`, `dxxta/Cheating-Detection-API`, and
`dxxta/Color-Sorter-IoT-Telegram`. To add another repository,
open `/admin`, create a project, set Source to `github`, enter its GitHub repo as
`owner/name`, then click "Sync from GitHub". Put optional screenshots in the
repository's `docs/demos/` folder using PNG, JPG/JPEG, WebP, or GIF files; the
first image alphabetically becomes the cover and the rest become the gallery.
`GITHUB_TOKEN` is optional and raises the GitHub API rate limit. To schedule or
manually request a refresh, POST to `/api/github-sync` with
`x-cron-secret: $CRON_SECRET` (set `CRON_SECRET` in `.env`).

**Real emails.** Set `SMTP_*` and `CONTACT_TO`. A local catcher such as Mailpit (`docker run -p 1025:1025 -p 8025:8025 axllent/mailpit`, then `SMTP_HOST=localhost SMTP_PORT=1025`) lets you read mail at http://localhost:8025.

## Troubleshooting

- **App fails at start with "Invalid environment configuration":** a required variable in `.env` is missing or too short; the message lists which.
- **`ECONNREFUSED` to Postgres:** run `docker compose up -d postgres` and check the port in `DATABASE_URI`.
- **Integration tests time out:** make sure Postgres is up and no other test run is using the same database.
- **Admin password changed in `.env` but old one still works:** restart `pnpm dev`; the seed runs on start.
- **Style or build oddities:** `pnpm devsafe` clears `.next` before starting.
