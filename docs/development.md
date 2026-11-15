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
- Admin: http://localhost:3000/console, log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The admin account is created (or its password updated) from `.env` every time the app starts. Registration is disabled.
- In dev, the database schema is pushed automatically when you change a collection.

## 4. About page content

On first app boot, the portfolio content is seeded automatically in development
and production when the Tech Stack collection is empty and the Profile global
has no name. The seed creates the profile, 28 technologies, 16 certificates
with their certificate images, nine projects, eight showcase pages, and the
merged portfolio PDF. Byecheating, FundConn, ColorSorter, Slipakar, and Notakar
are GitHub-backed; the app syncs their repo data while retaining resume copy
for the three linked resume projects. `SEED_CONTENT=false` disables this
first-boot seed, and `SEED_ALL=true` forces all seeds on the next boot.
On that same first boot the gallery images and the blog (categories, tags and posts) are seeded too.
Afterward, make content changes in `/console`; existing content is not overwritten
on later boots. The blog seed is not repeated after first boot; to add it to an existing site run `pnpm payload run src/seed/run-blog.ts`.
The home Profile global can set an optional `avatarAlt` photo that appears with a brief glitch on hover, keyboard focus, or tap.

To intentionally reapply the portfolio seed after editing the seed source, run
the manual upsert:

```bash
pnpm payload run src/seed/run.ts
```

The portfolio seed is idempotent and upserts the profile, technologies,
certificates, projects, showcase pages, event gallery images, and portfolio PDF. Run the GitHub sync
endpoint to refresh repository data after a manual seed. Blog content has a separate manual seed:

```bash
pnpm payload run src/seed/run-blog.ts
```

It creates the starter categories, tags, and posts. Current seed posts are the
private search-quality draft, the Cloudflare DNS article, the DevFest Jakarta
recap, and a published layout-check post. The three earlier writing, content
model, and server-components samples are removed when this seed runs.

Blog post table of contents links are generated from `h2` and `h3` headings and
are hidden when a post has none. Published posts can also show previous and next
post suggestions. Each published post has an AMP version at `/blog/<slug>/amp`,
with a canonical link back to the regular post page. Blog post images open in a
preview modal. The blog list is paginated at six posts per page. Comments use a full-width section below the article, with the
count above a card for joining the conversation and approved comments listed
below it.

Blog posts and project pages include a Share menu with copy-link, the device
share sheet when available, and plain intent links for X, LinkedIn, Facebook,
WhatsApp, Telegram, and email. These links load no third-party SDKs and set no
extra cookies; a network opens only after the visitor clicks its link. Share
actions use the `share_copy`, `share_native`, `share_x`, `share_linkedin`,
`share_facebook`, `share_whatsapp`, `share_telegram`, and `share_email`
analytics events, labeled `post:<slug>` or `project:<slug>`. To add a network,
add its encoded intent URL and Tabler icon in `src/components/share-button.tsx`
and add its event name to `src/lib/analytics.ts`.

Blog code blocks are highlighted on the server with Shiki. Supported languages
are TypeScript (`ts`/`tsx`), JavaScript (`js`/`jsx`), JSON, Bash (`bash`, `sh`,
`shell`, `zsh`), CSS, HTML, SQL, YAML, diff, Markdown, HTTP, Dockerfile, and
plain text. In the editor, code is a Code block with a language selector and is
rendered with Shiki. Add another language to the allowlist and singleton highlighter in
`src/components/blog/code-block.tsx` when needed.

Post cover images are used only for link previews (Open Graph and Twitter). If a
post has no cover image, its first body image is used; posts without images use
the site icon. The Cloudflare dashboard setup screenshots are excluded so the
article continues to use its Slipakar image. The AMP page also includes the
resolved social image as metadata, while its visible content comes from the
post body.

### Analytics

The admin-only analytics dashboard is the first page after admin login and is
also available from the sidebar. Summary cards, sparklines, the visits chart,
top lists, and the small country map show the last 7 days. Each card links to a
detail page with 7, 30, or 90 day ranges; country details include the world map.
Charts use Recharts and the map uses d3-geo, TopoJSON, world-atlas, and
i18n-iso-countries. Country is read from `CF-IPCountry` when the Cloudflare
proxy supplies it, and is shown as unknown during local development.
The dashboard and detail pages can export a watermarked PNG, share it where supported, or copy it to the clipboard.

The site stores visitor and IP hashes, country codes, paths, event names, and
short labels or reason codes; it does not store raw IP addresses or user agents.
Add click tracking by placing an allowed `data-track` event and optional
`data-track-label` on an important link or button. Prune records older than 90
days manually with `pnpm payload run src/seed/prune-analytics.ts`.

### Reactions and views

Guests can react without signing in. The site uses a one-year anonymous visitor
cookie and stores only salted hashes of that ID and the IP hash, which rotates
daily; it does not store raw IP addresses or user agents. Reactions are limited
to 30 writes per IP hash per hour and 10 per visitor per minute. Views are
counted by a client beacon after the page has been visible for 8 seconds and the
visitor interacts, at most once per visitor per post per UTC day. Same-origin
checks, a bot user-agent filter, and per-IP limits (60 inserts per hour and 20
distinct posts per day) reduce spam; admin sessions and preview views are
ignored. Counts are stored in the `post-reactions` and `post-views` collections
under Engagement. Old view rows can be pruned when needed.

### Gallery images

The gallery combines certificate images, project screenshots, and event photos.
Manage free-standing event images in `/console` under Gallery Images. The portfolio
seed uses the files in `seed-assets/gallery/`; run `pnpm payload run
src/seed/run-gallery.ts` to upsert only those gallery records without reseeding
profile or project content. Gallery photo uploads reference the Media collection.
The public gallery is paginated at 12 images per page.

### Feature flags

In `/console` → Site Settings → Feature flags, the owner can hide profile CV and
portfolio PDF download actions or hide Gallery links from the header, mobile
menu, footer, and sitemap. Both flags default to on, and `/gallery` returns a
404 while its flag is off. Missing settings or a failed settings read keep both
features enabled. Hiding profile downloads removes only the CV and portfolio
PDF controls; the About dialog, its OK button, and the About me action remain.

### Top marquee

A scrolling bar is fixed at the top of every page. By default it alternates
"Have a project or an idea in mind? Let's talk." with a "Contact me" link to
`/contact`, and "Only essential cookies here, no ads or trackers." with a
"Cookie details" link to `/cookies`. The Cookies page explains the site's
first-party cookies and browser storage.
To change it, open `/console` → Site Settings → Top marquee and set a message, an
optional link label and link URL, or untick "Show marquee" to hide it. If the
message is empty the default is used. The seed does not touch these fields, so
re-running it never overwrites marquee edits. The columns come from the
`20261115_120000_site_announcement` migration.

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

**Google sign-in (comments).** Create an OAuth client in Google Cloud Console with redirect URI `http://localhost:3000/api/auth/callback/google`, then set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` and `AUTH_SECRET` (`openssl rand -hex 32`) in `.env` and restart `pnpm dev`. Approve comments in `/console` under Comments (they start as `pending`).

**GitHub projects.** On first app boot, Byecheating, FundConn, and ColorSorter
are linked to GitHub while retaining their resume title, summary, and
description. Slipakar is added as a GitHub project whose title, summary, and
description sync from its repository. The default repositories are
`dxxta/slipakar`, `dxxta/fundconn`, `dxxta/Cheating-Detection-API`, and
`dxxta/Color-Sorter-IoT-Telegram`. To add another repository,
open `/console`, create a project, set Source to `github`, enter its GitHub repo as
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
