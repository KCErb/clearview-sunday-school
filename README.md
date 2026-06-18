# CWASS — Clearview Ward Adult Sunday School

The class website for [clearviewsunday.school](https://clearviewsunday.school): the weekly
study schedule, plus a place for students to share answers and ask questions — including folks
who can't make it on Sundays.

Installable PWA. No passwords — sign in with a magic email link.

## Stack

- **Vite + React 19 + TypeScript + Tailwind v4** (SPA), installable PWA via `vite-plugin-pwa`
- **Supabase** — magic-link auth, Postgres, storage (browser talks to it directly; Row-Level
  Security is the security boundary, so there is no custom server)
- **Cloudflare Pages** — static hosting + the `clearviewsunday.school` custom domain

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
- `submission-media` storage bucket — provisioned for the future audio/video phase

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
