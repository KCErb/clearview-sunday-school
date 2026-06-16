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
- `schedule` — the weekly plan; everyone signed in can read, only admin writes (seeded with
  sample weeks — edit them)
- `submissions` — answers & questions; you insert/read your own, the instructor reads all
- `submission-media` storage bucket — provisioned for the future audio/video phase

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

## Roadmap / follow-ups

- **Production email** — auth currently uses Supabase's built-in email (fine for the
  instructor's own testing, but rate-limited to ~2/hour). Before inviting the class, configure
  custom SMTP. The sibling `crowd-pulse` project uses **Postmark** (`smtp.postmarkapp.com:587`);
  reuse the Postmark account by adding a `clearviewsunday.school` sender signature, then set SMTP
  + a branded magic-link template in Supabase → Authentication → Emails. Custom email templates
  require custom SMTP (or a paid plan) to enable.
- **Audio/video submissions** — wire upload UI to the `submission-media` bucket. Free-tier
  storage is 1 GB; for real video, move media to Cloudflare R2 (10 GB free, no egress) or upgrade
  Supabase.
- **Approve-only signups** — if spam appears, flip `shouldCreateUser` off / use an allowlist and
  manually approve from the dashboard.
- **Ward check** — the instructor reviews first/last names in the Supabase dashboard.
