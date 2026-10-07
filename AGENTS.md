# AgriMate — running it locally

React 19 + TanStack Start (Vite) app with a **self-hosted Supabase** backend
(Postgres 17, GoTrue auth, PostgREST, Storage, Realtime). PayFast for payments,
Google Gemini for the AI features.

```sh
docker compose -f docker-compose.base44.yml up -d
```

- app (Vite dev server, hot reload): <http://localhost:3000>
- Supabase API gateway (nginx): <http://localhost:54321>

`docker-compose.base44.yml` is the only compose file in this repo. Every app
service runs from the cloned source, so edits under `src/` hot-reload.

## Things that are not obvious

- **Dependencies install with npm, not bun.** `bun.lock` is stale
  (`bun install --frozen-lockfile` fails with "lockfile had changes"), while
  `package-lock.json` matches `package.json`. `npm ci` additionally needs
  `--legacy-peer-deps`: `@cloudflare/vite-plugin` asks for vite ^6 while the
  project uses vite ^7 (the lockfile was built that way).
- **The Postgres image does most of the Supabase setup.** `supabase/postgres`
  already ships the `anon`/`authenticated`/`service_role`/`authenticator` roles,
  the `auth`, `storage` and `_realtime` schemas, `auth.uid()` and the
  `supabase_realtime` publication that the migrations reference.
  `supabase/local/db-init/*.sql` only add the service-role passwords, the JWT
  expiry setting and the Realtime v2 schema.
- **Migrations run after Storage, not at DB init.** The `migrate` service is the
  self-hosted equivalent of `supabase db push`: it waits for `storage` (which
  creates `storage.objects`), applies `supabase/migrations/*.sql` and records
  versions in `supabase_migrations.schema_migrations`, so re-running the stack is
  a no-op. It also seeds the public `listings` storage bucket, which is **not**
  in the migrations.
- **The Supabase CLI is not used.** `supabase/local/gateway.conf.template` (nginx)
  replaces the Supabase gateway on port 54321: it strips `/auth/v1`, `/rest/v1`,
  `/storage/v1` and `/realtime/v1`, and answers CORS for the app origin because
  app and API are on different ports.
- **Realtime needs its dotted name.** The container is named
  `realtime-dev.supabase-realtime` and the gateway forwards that as `Host`,
  because Realtime derives its tenant from the host name.
- **Healthchecks probe `127.0.0.1`, never `localhost`** — busybox `wget` in these
  images does not fall back from `::1`. `postgrest --ready` only works because
  `PGRST_ADMIN_SERVER_HOST/PORT` are set. The db probe must also pass
  `-d postgres`: plain `pg_isready -U supabase_admin` looks for a database named
  after the user and logs `FATAL: database "supabase_admin" does not exist` on
  every interval.
- **Local Supabase config lives in compose.** `SUPABASE_URL`, `VITE_SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` point at the local
  stack (with a development-only JWT secret), so no Supabase account is needed.
  `/run/base44/app.env` is appended as the last `env_file`, so any real
  credential delivered by the platform wins over the local values.
- `BASE44_PREVIEW_MODE` is passed through to the app but no application code or
  shared config is gated on it — the sandbox needs no source-level overrides.
- Signup works without SMTP because `GOTRUE_MAILER_AUTOCONFIRM=true`.

## Verify the stack

```sh
curl -s localhost:3000/ | head -c 200          # app serves its SSR HTML
curl -s "https://54321-$BASE44_PUBLIC_HOST_SUFFIX/auth/v1/health"
docker compose -f docker-compose.base44.yml ps # everything healthy, migrate exited 0
```

A full round-trip (signup → RLS read/write → storage upload → public fetch) can
be driven through the gateway with the local anon key from the compose file.

## Credentials that are still needed

- AI features (Crop Doctor, farm Q&A): `GEMINI_API_KEY` — or `LOVABLE_API_KEY`.
- Premium checkout: `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`,
  `PAYFAST_PASSPHRASE`.
- "Continue with Google" goes through Lovable's cloud auth and stays disabled
  locally.
