# dev.akarun

Personal site with an About page and blog. Next.js (App Router) + Payload CMS 3 + shadcn/ui, PostgreSQL. All content, including certificates, tech stack and projects, is managed in Payload (`/admin`), which only the owner can log into.

## Run it locally

```bash
pnpm install
cp .env.example .env          # then fill DATABASE_URI, PAYLOAD_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d postgres
pnpm dev                      # http://localhost:3000  (admin: /admin)
```

The portfolio (profile, tech stack, certificates with images, and eight
projects, including four GitHub-backed projects) seeds and syncs automatically
on the first boot in development and production. Set `SEED_CONTENT=false` to disable first-boot
seeding. To reapply the portfolio upsert manually, run
`pnpm payload run src/seed/run.ts`. Blog sample content is manual only:
`pnpm payload run src/seed/run-blog.ts`.

Projects are sourced from GitHub. In `/admin`, create a project, set Source to
`github`, enter the repository as `owner/name`, and click "Sync from GitHub".
Optional screenshots go in `docs/demos/` as PNG, JPG/JPEG, WebP, or GIF files;
the first image alphabetically is the cover and the rest populate the gallery.
`GITHUB_TOKEN` raises the GitHub API rate limit.

Full guide, commands, tests and optional features: [docs/development.md](docs/development.md).

## Deploy

Dokploy on a VPS using `docker-compose.prod.yml`: [docs/deployment.md](docs/deployment.md).

## Project docs

- [docs/development.md](docs/development.md): local development guide
