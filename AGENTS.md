# AgriMate — Base44 Development Notes

## Stack
- **TanStack Start** SSR app (Vite 7 + Nitro) with React 19, TanStack Router/Query.
- **Package manager: Bun** (`bun.lock` + `bunfig.toml`). The `bunfig.toml` sets a 24h `minimumReleaseAge` guard.
- **Backend: hosted Supabase** (auth + Postgres). No local database — all data/auth goes to the user's Supabase project.
- UI: Tailwind CSS v4, Radix UI, shadcn-style components in `src/components/ui`.
- Payments: PayFast (server-side). AI: Google Gemini (server-side).

## Running in Base44
- `docker compose -f docker-compose.base44.yml up -d` starts the Vite dev server on **port 8080** (mapped to host 3000).
- The `@lovable.dev/vite-tanstack-config` wrapper forces `server.port: 8080` and `host: "::"` in non-sandbox mode (our case — `LOVABLE_SANDBOX` is not set).
- `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` (set by the platform) is passed through so Vite accepts the preview proxy hostname.
- **Install note:** `bun install --frozen-lockfile` fails because the lockfile was generated with an older Bun and the 24h release-age guard causes resolution drift under Bun 1.4.x. The compose uses a plain `bun install` (non-frozen) which regenerates the lockfile for the current Bun.

## Environment / Secrets
- Secrets are delivered to `/run/base44/app.env` (outside the repo) and wired via `env_file` in compose.
- **Required for full functionality (not for boot):**
  - `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` (server/SSR) and `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (client bundle).
  - `GEMINI_API_KEY` (AI crop-doctor), `PAYFAST_*` (premium payments), `SUPABASE_SERVICE_ROLE_KEY` (admin ops), `LOVABLE_API_KEY` (alt AI).
- **The app boots and renders the landing page with zero credentials.** The Supabase client is a lazy Proxy; `AuthProvider` catches the "missing env" error and renders as signed-out. Supabase-dependent routes (login, dashboard, data) need real credentials.

## Key Architecture
- `src/integrations/supabase/client.ts` — lazy Proxy client; throws on first access if env vars missing (caught by providers).
- `src/lib/auth.tsx` — `AuthProvider` wraps the whole app; degrades gracefully without Supabase.
- `src/lib/premium.tsx` — subscriptions disabled; everything unlocked (`isPremium: true`).
- `src/server.ts` — Cloudflare/Nitro fetch entry with SSR error wrapper.
- `src/routes/` — file-based routes (TanStack Router); `__root.tsx` wraps in Auth/Profile/Premium providers.

## Verify
- `curl -s -H "Accept-Encoding: identity" http://localhost:3000/ | strings | grep -i agrimate` → confirms landing page.
- Preview: landing page at `/` renders; auth-gated routes need Supabase credentials.
