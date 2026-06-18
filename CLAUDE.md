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
  auth/                 AuthProvider + context + useAuth (session, profile, magic-link sign-in)
  components/           Logo, Spinner, Protected (route guard), Footer (disclaimer + KC+AI)
  components/thisweek/  AnswerForm, QuestionCard, AskQuestion, AddQuestion, AdminInquiries
  lib/                  supabase.ts (client), types.ts (DB rows), cfm.ts (CFM URLs/dates)
  pages/                Splash (/), Login (/login), AuthCallback (/auth/callback), ThisWeek (/this-week)
```

`/this-week` is the member landing: 2 most-recent CFM lessons (date-driven) → instructor
question cards → answers (anonymity = null author_id; share_pref; KC publishes). Class reads
only `shared_answers`/`shared_inquiries` views (no author_id). Admin (is_admin) gets inline
publish/add-question/answer-inquiry controls. `/app` redirects to `/this-week`.

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
