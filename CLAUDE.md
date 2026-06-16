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
  auth/        AuthProvider + context + useAuth (session, profile, magic-link sign-in)
  components/  Logo, Spinner, Protected (route guard)
  lib/         supabase.ts (client), types.ts (DB row types)
  pages/       Splash (/), Login (/login), AuthCallback (/auth/callback), Dashboard (/app)
```

## Key facts

- Supabase project ref: `alfwjhczzefvcevmlcif` (org "KCErb's Org", region us-west-1).
- Cloudflare zone `clearviewsunday.school`, account `601668d4ec4cb714929e04b4810ced91`.
- Admin/instructor email `iamkcerb@gmail.com` — drives `is_admin()` + the signup trigger.
- Auth uses **implicit** flow (not PKCE) on purpose: magic links must survive being opened in a
  different browser than requested.
- DB types in `src/lib/types.ts` are hand-maintained — update them alongside any migration.
- Email is Supabase built-in for now (~2/hr); production email = Postmark (see README roadmap).

## Conventions

Mirror the sibling project `../crowd-pulse` (same stack). Keep RLS tight; never expose the
service-role key in client code or commits.
