# CWASS — notes for Claude

Class website for the Clearview Ward Adult Sunday School (clearviewsunday.school).

## Commands

```bash
pnpm dev        # dev server (5173)
pnpm build      # tsc -b && vite build
pnpm typecheck  # tsc -b --noEmit
pnpm lint       # eslint
pnpm preview    # serve the production build
```

## Stack & structure

- Vite + React 19 + TS + Tailwind v4 + React Router v7, PWA via vite-plugin-pwa. pnpm.
- Supabase (auth + Postgres + storage), accessed directly from the browser; **RLS is the only
  security boundary** — every table has policies in `supabase/migrations/`.
- Cloudflare Pages hosting; deploy via GitHub Actions (`.github/workflows/deploy.yml`).

```
src/
  auth/                 AuthProvider + context + useAuth (adds profileLoaded for admin guard)
  components/           Logo, Spinner, Protected, AdminRoute (admin-only guard), Footer
  components/toast/     ToastProvider + useToast (transient confirmation banner)
  components/thisweek/  AnswerForm, AskQuestion, MyResponses (member edit/delete own)
  components/manage/    QuestionEditor, ResponsesPanel, InquiriesPanel (admin moderation)
  components/live/      AttributionBanner, PromptInput, TallyBars (in-class live prompts)
  data/cwass.ts         all DB reads/writes (sessions/questions/answers/inquiries/live)
  lib/                  supabase.ts, types.ts, cfm.ts (CFM URLs/dates), useLiveRefresh.ts
  pages/                Splash, Login, AuthCallback, ThisWeek (/this-week), QuestionPage (/q/:id), Live (/live), Manage (/manage)
```

Model is **teaching sessions**, not raw CFM weeks. A `session` (a Sunday KC teaches) covers
1+ CFM weeks (`cfm_weeks int[]`) and holds `questions` tagged `category` study|home (+ optional
`reference_url`). `/this-week` shows the latest **published** session (KC controls via the
publish flag); questions are grouped study/home and each links to its own page `/q/:id`.
Answers: anonymity = null author_id; members own their identified answers (read/edit/delete via
RLS) and a trigger force-unpublishes + stamps `edited_at` on any non-admin edit (re-approval).
Class reads only `shared_answers`/`shared_inquiries` views (no author_id). All admin moderation
lives at `/manage` (AdminRoute); member pages stay clean. `/app` → `/this-week`.

**Live prompts** (in-class real-time): a session goes into *live mode* (`sessions.is_live`, one at
a time); `/live` wakes from idle and KC sends prepared prompts one at a time from
`/manage/s/:id/live`. Kinds: single|multi|text. Attribution is **per prompt, set by KC** — an
`anonymous` prompt cannot store `author_id` (RLS enforces it), a `named` one is visible to KC
only. Names never reach the class; `reveal` exposes counts via `live_tallies`. Transport is
interval polling (`useLiveRefresh`), deliberately not Realtime. Presence via the `live_heartbeat()`
RPC; responder counts via `count(distinct submission_id)`. See `docs/live-prompts.md` and
`supabase/tests/live_prompts_rls.sql` (re-runnable, 20/20).

## Key facts

- Supabase project ref: `alfwjhczzefvcevmlcif` (org "KCErb's Org", region us-west-1).
- Cloudflare zone `clearviewsunday.school`, account `601668d4ec4cb714929e04b4810ced91`.
- Admin/instructor email `iamkcerb@gmail.com` — drives `is_admin()` + the signup trigger.
- Auth uses **implicit** flow (not PKCE) on purpose: magic links must survive being opened in a
  different browser than requested.
- DB types in `src/lib/types.ts` are hand-maintained — update them alongside any migration.
- Email is **live via Postmark** (account also hosts crowd-pulse): dedicated "CWASS" server
  (id 19592685), domain DKIM+Return-Path verified, sends branded magic links from
  admin@clearviewsunday.school. Receiving for admin@ (CF Email Routing) still needs a manual
  dashboard step (see README).

## Conventions

Mirror the sibling project `../crowd-pulse` (same stack). Keep RLS tight; never expose the
service-role key in client code or commits.
