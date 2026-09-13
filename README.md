# Clearview Sunday School

A simple class input screen at [clearviewsunday.school](https://clearviewsunday.school).
Open the address, tap a choice, and change it any time while the question is open.
No participant accounts, submit buttons, codes, CAPTCHA, or public results.

- `/` — current question or waiting screen; `/live` and `/app` redirect here.
- `/manage` — teacher question library, live private results, and history. Existing admin magic-link login.
- `/archive` — previous study website and its management, with original access controls.
- `/preview/polls/manage` — teacher + phone simulation, available in dev or an explicit preview build.
- `/preview/polls` — participant simulation. Preview data lives only in this browser, never in Supabase.

## Polling architecture

New tables in migration `0016_polling_rewrite.sql` are separate from all legacy content.
`polls` and ordered `poll_options` define questions. `poll_room` holds the current question.
`poll_answers` stores one replaceable selection per question / hashed browser secret.
Raw tokens stay in browser storage. No participant names or accounts are recorded.
Clearing storage or changing browsers creates a separate response identity.

Anonymous RPCs: `poll_current`, `poll_my_answer`, `poll_answer`.
Admin RPCs: `poll_library`, `poll_save`, `poll_action` (open / close / delete).
All direct table access is revoked. Admin functions check the existing `is_admin()` identity.
Selections, open epochs, and revisions are verified in a transaction. A question locks after its
first nonempty answer, even if later cleared. Reopen retains results; Ask again makes a new draft.

The browser serializes/coalesces saves and polls every two seconds while visible. Network errors
retain pending changes, but closing/reopening invalidates older pending work. Save acknowledgements
are required before displaying “Saved”. Storage failure degrades to in-memory continuity.

## Preview and launch

`pnpm dev` serves both working screens and the simulated preview. The preview toolbar can pause
connections and reset sample questions. Do not use the preview for real class responses.

Push `polling-rewrite` for a Cloudflare branch preview; builds include the preview routes only on
non-production branches. Production builds exclude the simulation module. The supplied Church
Design System is the source for the new screen styles; the archive keeps its prior design.

Before production: apply the additive migration, verify anonymous RPC access and teacher login,
and review the hosted preview. `main` deploys only after frontend and database tests pass and the
live `poll_current` RPC responds successfully. Roll back the Pages deployment if necessary; retain
the additive tables so responses are not lost. PWA clients refresh automatically on a new build.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
# Temporary PostgreSQL only (bootstrap is not for production):
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f tests/postgres-bootstrap.sql \
  -f supabase/migrations/0016_polling_rewrite.sql -f supabase/tests/polling.sql
# Apply migration through Management API; reads the existing PAT without printing it:
python3 scripts/supabase-query.py supabase/migrations/0016_polling_rewrite.sql
```

The SQL suite rolls back its fixtures and works through psql or the Management API. The bootstrap file models the existing JWT-based admin check for local/CI use.

## Existing platform and archive reference

React 19, TypeScript, Vite, Tailwind, Supabase, Cloudflare Pages. The sections below document
the archived site and existing account setup; its earlier roadmap is historical.

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in the values below
pnpm dev                     # http://localhost:5173
```

`.env.local` (these are **public** client values — safe to ship; never put service keys here):

```
VITE_SUPABASE_URL=https://alfwjhczzefvcevmlcif.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...   # Supabase dashboard → Project Settings → API keys
```

Scripts: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm preview`.

**Design playground:** with `pnpm dev` running, open `/preview` (dev-only route) — a sandbox
for trying design elements and Christ-centered art treatments without touching real pages.
Edit `src/pages/Preview.tsx`. Art lives in `public/art/` (Carl Bloch, public domain).

## How auth works

The login form collects first name, last name, and email, then sends a magic link
(`supabase.auth.signInWithOtp`, **implicit** flow so links work even when opened in a different
browser/in-app webview than they were requested from). First/last name are stored in user
metadata and copied into `public.profiles` by a database trigger on signup. The instructor is
flagged as admin by email.

**Admin / instructor:** `iamkcerb@gmail.com` (hard-coded in `is_admin()` and the signup trigger
in `supabase/migrations/0001_init.sql`). Change it there if the instructor changes.

## Database

Schema lives in [`supabase/migrations/`](./supabase/migrations) and is the source of truth:

- `profiles` — one row per user (first/last name, `is_admin`), populated by trigger
- `lessons` — all 52 Come, Follow Me 2026 weeks (reference catalog; URL derived from `cfm_week`)
- `sessions` — a Sunday KC teaches; spans 1+ CFM weeks (`cfm_weeks int[]`), `is_published`
  controls class visibility. `/this-week` shows the latest published session
- `questions` — belong to a session, tagged `category` study|home, optional `reference_url`
- `answers` — member responses. **Anonymity = `author_id` left NULL** (truly not recorded).
  Members own their identified answers (read/edit/delete via RLS); a trigger force-unpublishes
  and stamps `edited_at` on any non-admin edit (KC re-approves). Class reads only KC-published
  rows via the `shared_answers` view (no `author_id`). `share_pref` = "don't quote me verbatim"
- `inquiries` — member-asked questions (same anonymity); KC answers + publishes, surfaced via
  the `shared_inquiries` view
- `live_prompts` / `live_options` / `live_responses` / `live_presence` — in-class real-time
  input (see below)
- `submission-media` storage bucket — provisioned for the future audio/video phase

### Live prompts

`/live` is the page the class sits on during the lesson. KC puts a session in **live mode**
(`sessions.is_live`) from `/manage/s/:id/live`, then taps a prepared prompt to send it — pick
one, pick any, or write-in. Responses land privately on his console, alongside "N on the app /
M responded" so a low count can be read against how much of the room is even holding a phone.

Attribution is set per prompt by KC and enforced by RLS: an `anonymous` prompt physically cannot
store an `author_id`, and on a `named` prompt only KC ever sees the name. **Names never reach the
class** — the optional "Show the class" reveal exposes aggregate counts only, via the
`live_tallies` view.

Verified end-to-end: [`supabase/tests/live_prompts_rls.sql`](./supabase/tests/live_prompts_rls.sql)
impersonates a real non-admin member and asserts 20 properties (20/20 passing). Run it the same
way as a migration. Design notes: [`docs/live-prompts.md`](./docs/live-prompts.md).

All admin moderation (sessions, question CRUD, publishing, inquiries) lives at `/manage`
(admin-only). `is_admin()` = JWT email matches the instructor.

Security model is verified end-to-end (anonymity, identity-spoof prevention, published-view
column hiding) — see the verification steps in commit history / `0003_thisweek.sql`.

Apply a new migration with the Supabase Management API (project ref `alfwjhczzefvcevmlcif`):

```bash
PAT=$(head -1 ~/tmp/supabase_pat)
python3 -c "import json,sys;open('/tmp/q.json','w').write(json.dumps({'query':open(sys.argv[1]).read()}))" supabase/migrations/000X_name.sql
curl -s -X POST "https://api.supabase.com/v1/projects/alfwjhczzefvcevmlcif/database/query" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" --data-binary @/tmp/q.json
```

## Deploy

Pushing to `main` runs CI (`typecheck`, `lint`, `build`) and deploys to Cloudflare Pages via
GitHub Actions. Required repo configuration:

- **Variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

Manual deploy: `CLOUDFLARE_API_TOKEN=… pnpm exec wrangler pages deploy dist --project-name=clearview-sunday-school`.

## Email

Magic links send via **Postmark** (dedicated "CWASS" server) from
`admin@clearviewsunday.school`, branded. Domain DKIM + Return-Path are verified in Cloudflare
DNS. Configured in Supabase → Authentication (SMTP + magic-link template).

**Outstanding (KC, ~2 min in the Cloudflare dashboard):** to make `admin@clearviewsunday.school`
*receive* mail (forward to Gmail), open Cloudflare → the domain → **Email → Email Routing →
Enable**, then add `iamkcerb@gmail.com` as a destination and click the verification link. The
forwarding rule (`admin@` → Gmail) is already created; it just needs routing enabled + the
destination verified. (The API token lacks the account-level Email Routing Addresses
permission, so this last step is manual.)

## Roadmap / follow-ups

- **Audio/video submissions** — KC's intent: text first, then ephemeral media (compressed,
  auto-deleted after the teaching week). Wire upload UI to the `submission-media` bucket + a
  cleanup job. Free-tier storage is 1 GB; for real video, move media to Cloudflare R2 (10 GB
  free, no egress) or upgrade Supabase.
- **Approve-only signups** — if spam appears, flip `shouldCreateUser` off / use an allowlist and
  manually approve from the dashboard.
- **Post-class recap** — a short "where the discussion went" note per lesson for remote members
  (deferred; design ready).
- **Ward check** — KC reviews first/last names in the Supabase dashboard.
