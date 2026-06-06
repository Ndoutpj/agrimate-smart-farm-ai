# AgriMate Multi-Role Expansion — Phased Plan

This request is very large (3 new user roles, marketplace, jobs board, equipment bookings, in-app chat, certifications, grants, multilingual, offline sync, 3D stats, etc.). Building it all in one shot would take many hours, produce too much untested code, and almost certainly regress your existing screens.

I propose shipping it in **6 phases**. Each phase is independently usable and testable. After each phase you can review and adjust priorities.

---

## Phase 1 — Foundation (role system + verification)

- Add `account_type` enum (`farmer | buyer | service_provider`) on `profiles`.
- Add `is_service_provider_enabled` boolean (lets farmers toggle SP mode).
- Add `verification_status` (`unverified | pending | verified`) + `verification_documents` storage bucket.
- Update Sign-Up to ask for account type with 3 cards (🌱 Farmer / 🛒 Buyer / 🔧 Service Provider).
- Update `_authenticated` layout to route to the correct dashboard + bottom-nav per role.
- Add reusable `<RoleBottomNav />` component with role-specific tabs.
- Add `<VerificationBadge />` component used everywhere a profile is displayed.

## Phase 2 — Buyer dashboard + Produce Marketplace

- DB: `listings`, `listing_images`, `orders`, `ratings`.
- Farmer: create/manage listings, view offers, mark sold.
- Buyer: browse, filter (crop/region/price/qty), order, rate farmer.
- Order history + active orders.
- In-app messaging thread per listing (basic `messages` table + realtime).

## Phase 3 — Service Provider dashboard + Equipment Browse + Jobs Board

- DB: `services` (equipment listings), `bookings`, `jobs`, `job_applications`.
- SP: list services, accept/decline bookings, earnings tracker, availability calendar.
- Farmer: browse equipment, book; post jobs, review applicants, rate workers.
- Worker (uses Buyer or new lightweight role) applies to jobs.
- Reuse messaging from Phase 2.

## Phase 4 — Farmer "My Farm" expansion + Stats + P&L

- New screens: Crop Rotation Planner, Farm Journal, Irrigation Scheduler, Climate & Drought Planning.
- DB: `farm_crops`, `farm_journal_entries`, `irrigation_schedule`, `expenses`, `sales`.
- Stats page: per-crop cards (hectares, days-to-harvest, spend, yield, profit, AI health score).
- 3D animated graphs (react-three-fiber + recharts overlays).
- P&L tracker with season-vs-season comparison.
- Upgrade Calculator (additive — no UI breakage): add GPS, soil, irrigation, variety, planting date as **optional advanced inputs**.

## Phase 5 — Certifications + Grants + Notifications

- Courses (`courses`, `course_progress`, `certificates`).
- PDF certificate generator (jsPDF) — A4 landscape, green border, gold seal, QR verify code, public verify route.
- Grants finder (`grants` table, filter by province/size/crop, alert subscriptions).
- Notifications center (`notifications` table + bell icon + toast).

## Phase 6 — Polish: i18n, offline, ratings everywhere

- i18n with `react-i18next`: en, zu, xh, st, sw, ha.
- Offline mode via service worker + IndexedDB queue (writes replay on reconnect).
- Universal ratings/reviews component wired into orders, bookings, jobs.

---

## Things I will explicitly NOT touch (per your instructions)

Existing Calculator UI, AI Crop Doctor, Weather, Knowledge Hub, Community, Smart Reminders, branding/colors. Calculator gains new **optional** inputs only — the current form stays as the default view.

## Technical notes (skim if non-technical)

- All new tables: RLS scoped to `auth.uid()`, `GRANT` to `authenticated`, `service_role`.
- Images via Lovable Cloud storage buckets (`listings`, `services`, `certificates`, `verifications`).
- In-app chat uses Supabase Realtime on a `messages` table.
- 3D graphs: `@react-three/fiber` + `@react-three/drei` (~120kb gz; acceptable on low-end Android with lazy load).
- Certificates: `jspdf` + `qrcode` libs, generated client-side.
- i18n: `react-i18next` with JSON resource bundles per language.
- Offline: Workbox + Dexie queue. PWA install optional — only enable if you want it.

---

## Questions before I start Phase 1

1. **Scope confirmation**: OK to ship in these 6 phases, one phase per turn?
2. **Existing users**: Should current accounts default to `farmer`, or prompt them to pick on next login?
3. **Verification documents**: Auto-approve on upload, or require manual admin review (would need an admin role + review screen — adds scope)?
4. **PWA / offline**: You listed offline mode. That requires enabling PWA. Confirm you want this (it changes how the app installs on phones).

Reply with answers (or just "go" to use sensible defaults: existing users → farmer, verification → auto-approve for now, PWA → yes) and I'll start Phase 1.