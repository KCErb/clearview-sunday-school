# Live prompts — in-class, real-time input

Status: **built and verified** (migrations `0014`, `0015`). RLS verified end-to-end —
20/20 checks pass, see `supabase/tests/live_prompts_rls.sql`.

## What this is

A page the class sits on during the lesson that is **idle until KC opens a prompt**. When he
opens one, everyone's device shows buttons (or a text box), they answer, and KC watches the
results come in **privately on his own device**.

Two motivating cases, both real:

1. **The vote.** KC presents four gospel principles on a slide and asks which the class wants to
   study. He sees the tally and makes the call. This is not a democracy — he's the teacher trying
   to receive revelation — but that includes getting good information, and a private vote removes
   the collective-action friction of raising hands in a room where everyone is watching everyone
   else.
2. **The quiet comment.** A student who would never raise a hand types their experience. KC reads
   it and can bring it into the discussion in whatever way serves.

The design goal that follows from both: **lower the cost of contributing** without turning the
class into a poll-driven majority machine.

## Naming

The concept is a **live prompt**. Not "poll" — a poll implies the count decides, which is exactly
the wrong frame, and half of these are free-text anyway.

- Class route: `/live`
- Tables: `live_prompts`, `live_options`, `live_responses`, `live_presence`
- UI copy: "Live", "Go live", "Tap to send", "Show the class", "Close"

## Live mode

The feature is a **mode**, not a publish. KC hits **Go live** on a session; the class's `/live`
page wakes from "Nothing live right now" to "We're live", and stays there between prompts. He
then taps a prompt from his prepared menu, confirms, and it goes out.

This matters because it separates two things a publish flag would conflate: *the class is
gathered and paying attention* vs *there is a question in front of you right now*. The waiting
state is most of the hour, and it should feel intentional.

Live mode lives on `sessions.is_live`, with a partial unique index so only one session is live at
a time. Ending it closes whatever prompt was open. RLS keys off it: the class can only see
prompts belonging to a session that is currently live — so last month's prompts don't leak, and
a live session is visible to the class even if it isn't published yet.

## Reading the room

KC needs to interpret a number of responses against how many people are even holding the app.
"5 on the app, 4 responded" is a very different signal from "28 on the app, 2 responded" — the
first is a quorum of the engaged, the second is a room that just declined to answer.

So the console shows two meters: **on the app** (presence) and **responded**.

- **Presence** — `/live` pings `live_heartbeat()` every 12s; KC counts rows seen in the last 30s.
  The heartbeat is a `security definer` RPC taking no arguments, deriving the user from
  `auth.uid()`, so it can only ever write the caller's own row. Members have **no direct
  privileges on `live_presence` at all** — they cannot read the roster or write anyone else's row.
- **Responded** — `count(distinct submission_id)`. A multi-select answer writes N rows but one
  `submission_id`, so "4 people responded" stays correct without recording who they are. This is
  the one piece of machinery that makes an anonymous prompt countable.

Presence does mean KC knows *who is in the room with the app open* — that's attendance, not
response content, and it never links a person to an answer. Worth knowing it's there.

## Settled decisions

| Decision | Choice | Why |
|---|---|---|
| Who sets attribution | **KC, per prompt. No student override.** | One uniform rule per prompt is easier to state honestly in a banner, and a mixed tally ("7 votes, 3 of them anonymous") is harder to reason about mid-lesson. Students always see the rule before they answer. |
| One response per person | **Honor system + device guard (`localStorage`).** | Enforcing it on anonymous prompts requires storing identity somewhere, which weakens the promise the rest of this site makes. In a chapel with ~20 people the honor system is sufficient. |
| v1 response types | **single-select, multi-select, short text** | Covers both motivating cases. Scale/ranking are additive later with no change to the response row shape. |
| Class sees the tally | **Yes, via an explicit per-prompt toggle, off by default** | Private by default preserves the "not a democracy" stance; the toggle is there for the moments when showing the room its own mind is the point. |

### The attribution invariant

Two modes, set by KC when he builds the prompt:

- **`anonymous`** — `author_id` is never written. Not even KC knows who. Same semantics as
  `answers.is_anonymous` today: anonymity is the *absence* of recorded identity, not a flag that
  hides it.
- **`named`** — `author_id` is stored. **Only KC ever sees it.**

**Names never reach the class, in either mode.** Revealing results shows aggregate counts only —
no names, no bodies. This is why v1 has no per-student "you may use my name in class" consent
(`attribution_ok` on `answers`/`insights`): in a live prompt nothing a student writes is ever
shown to the room with their name attached, so there is nothing to consent to. If text reveal is
ever added (see Deferred), that consent must be added with it.

The class-facing banner must state the mode in plain language before anyone answers:

> 🔒 **Anonymous** — your name is not recorded. Not even KC will know who answered.

> 👤 **KC sees your name** — your response is linked to you. It stays between you and KC; your
> name is never shown to the class.

## Data model

One row per *selected option*, so a multi-select answer is N rows. Tallies become a plain
`group by`, and single/multi/text all share one table shape.

```sql
-- supabase/migrations/0014_live_prompts.sql

create table public.live_prompts (
  id           bigint generated always as identity primary key,
  session_id   bigint not null references public.sessions (id) on delete cascade,
  kind         text not null check (kind in ('single','multi','text')),
  prompt       text not null,
  detail       text,                                   -- optional helper line
  attribution  text not null default 'anonymous' check (attribution in ('anonymous','named')),
  status       text not null default 'draft'     check (status in ('draft','open','closed')),
  reveal       boolean not null default false,         -- show the tally to the class
  sort_order   integer not null default 0,
  opened_at    timestamptz,
  closed_at    timestamptz,
  created_at   timestamptz not null default now()
);

-- At most one prompt is open across the whole site (one class, one teacher).
create unique index live_prompts_one_open on public.live_prompts (status) where status = 'open';

create table public.live_options (
  id          bigint generated always as identity primary key,
  prompt_id   bigint not null references public.live_prompts (id) on delete cascade,
  label       text not null,
  sort_order  integer not null default 0
);

create table public.live_responses (
  id          bigint generated always as identity primary key,
  prompt_id   bigint not null references public.live_prompts (id) on delete cascade,
  option_id   bigint references public.live_options (id) on delete cascade,  -- null for text
  body        text,                                                          -- null for votes
  author_id   uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint live_responses_shape check (option_id is not null or body is not null)
);

create index live_responses_prompt_idx on public.live_responses (prompt_id);
```

### RLS

Same posture as the rest of the schema: RLS is the only boundary, admin is `is_admin()`.

```sql
alter table public.live_prompts   enable row level security;
alter table public.live_options   enable row level security;
alter table public.live_responses enable row level security;

-- Drafts are KC's alone; open and closed prompts are readable by the class.
create policy "live_prompts_read" on public.live_prompts for select to authenticated
  using (status in ('open','closed') or public.is_admin());
create policy "live_prompts_admin" on public.live_prompts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "live_options_read" on public.live_options for select to authenticated
  using (exists (
    select 1 from public.live_prompts p
    where p.id = prompt_id and (p.status in ('open','closed') or public.is_admin())
  ));
create policy "live_options_admin" on public.live_options for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- The prompt must be OPEN, and the row must match the prompt's attribution mode.
-- This is what makes the banner's promise true: on an anonymous prompt the database
-- itself refuses a response that carries an author_id.
create policy "live_responses_insert" on public.live_responses for insert to authenticated
  with check (exists (
    select 1 from public.live_prompts p
    where p.id = live_responses.prompt_id
      and p.status = 'open'
      and (
        (p.attribution = 'anonymous' and live_responses.author_id is null) or
        (p.attribution = 'named'     and live_responses.author_id = auth.uid())
      )
  ));

-- Named responders own their rows (so they can change their mind while it's open).
create policy "live_responses_own" on public.live_responses for select to authenticated
  using (author_id = auth.uid());
create policy "live_responses_delete_own" on public.live_responses for delete to authenticated
  using (author_id = auth.uid());
create policy "live_responses_admin" on public.live_responses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
```

Note there is **no member `select` policy on anonymous rows at all** — not even the person who
wrote one can read it back. That's correct and worth keeping: the row is genuinely detached.

### The tally view

Aggregate counts only, and only when KC has flipped `reveal`. Follows the existing
`shared_answers` / `shared_insights` pattern (view owned by `postgres`, so it reads past RLS on
the base tables; the `where` clause is the boundary).

```sql
create view public.live_tallies as
  select o.prompt_id, o.id as option_id, o.label, o.sort_order,
         count(r.id)::int as votes
  from public.live_options o
  join public.live_prompts p on p.id = o.prompt_id
  left join public.live_responses r on r.option_id = o.id
  where p.reveal = true
  group by o.prompt_id, o.id, o.label, o.sort_order;

grant select on public.live_tallies to authenticated;
```

It exposes no `body`, no `author_id`, and no rows for un-revealed prompts. Options with zero
votes still appear (the `left join`), which matters — a revealed tally that silently drops the
unpopular option would misrepresent the room.

### Opening a prompt atomically

The partial unique index means opening B while A is open would fail. A tiny `security invoker`
function keeps it to one round trip; RLS still applies, so only KC can actually do it.

```sql
create or replace function public.open_live_prompt(p_id bigint)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.live_prompts set status = 'closed', closed_at = now()
    where status = 'open' and id <> p_id;
  update public.live_prompts set status = 'open', opened_at = now(), closed_at = null
    where id = p_id;
end;
$$;
```

### `src/lib/types.ts`

Hand-maintained, as always — update alongside the migration.

```ts
export type LiveKind = 'single' | 'multi' | 'text';
export type LiveAttribution = 'anonymous' | 'named';
export type LiveStatus = 'draft' | 'open' | 'closed';

export interface LivePrompt {
  id: number; session_id: number; kind: LiveKind; prompt: string; detail: string | null;
  attribution: LiveAttribution; status: LiveStatus; reveal: boolean; sort_order: number;
  opened_at: string | null; closed_at: string | null; created_at: string;
}
export interface LiveOption { id: number; prompt_id: number; label: string; sort_order: number }
export interface LiveResponse {
  id: number; prompt_id: number; option_id: number | null; body: string | null;
  author_id: string | null; created_at: string;
}
export interface LiveTallyRow {
  prompt_id: number; option_id: number; label: string; sort_order: number; votes: number;
}
```

## Transport: polling, not Realtime

**v1 polls on an interval.** Supabase Realtime would work, but a dropped channel fails silently,
and the one moment this feature must not fail is a chapel full of phones on spotty LTE with
backgrounded tabs. An interval refetch is a few lines, is trivially debuggable, and self-heals.

| Where | Interval | Notes |
|---|---|---|
| `/live`, idle | 4s | one-row query |
| `/live`, prompt open | 4s | picks up close / reveal |
| `/manage/s/:id/live` (KC's console) | 2s | he wants it to feel live |
| `/this-week` banner | 15s | runs all week, so keep it cheap |

All of them pause on `document.hidden` and refetch immediately on `visibilitychange` — phones
background aggressively, and coming back to a stale page is the failure people would notice.

A single `useLiveRefresh(fn, ms)` hook in `src/lib/useLiveRefresh.ts` covers all of them,
plus the 12s presence heartbeat.

Realtime is a clean later upgrade: the data functions don't change, only what triggers them.

## Routes & UI

```
/live                class-facing (Protected) — the page people sit on
/manage/s/:id/live   KC's console: go live, build prompts, send, watch (AdminRoute)
```

Build and run collapsed into **one** console rather than the two pages first sketched. Mid-lesson
you shouldn't have to navigate between "my menu" and "the results" — the open prompt's results
sit at the top of the same page the menu is on.

### `/live` states

| State | What the member sees |
|---|---|
| Nothing open | Calm idle card: "Nothing live right now — hang tight." Plus a link back to `/this-week`. This is the resting state for most of the hour; it should look intentional, not broken. |
| Prompt open, not answered | Attribution banner, the prompt, and the input for its `kind`. One big submit button. |
| Answered | "Thanks — got it." Named prompts also get a "Change my answer" affordance while it's still open. |
| Answered, `reveal` on | The tally bars, updating. |
| Closed, no revealed tally | Returns to the "We're live" waiting card. A closed question left on screen under a "thanks" card reads as a half-finished reset. |
| Closed, tally revealed | Keeps the prompt and its tally up until KC opens the next one or ends the session, so a revealed result doesn't vanish mid-read. |

Members reach `/live` two ways: directly (KC says "go to the live page"), or via a pill on
`/this-week` that appears when something is open. The pill is the real path — nobody types a URL
mid-lesson.

### `/manage/s/:id/live` — the console

Built for KC's phone while he's standing up teaching. Big touch targets, minimal chrome:

- **Go live / End live session** at the top, with the room meters beside it
- The prepared prompt menu: **tap a prompt → confirm → it goes out.** The confirm step is
  deliberate — a mis-tap should not fire a question at the room.
- The open prompt lifts to the top of the page with live tally bars (or text streaming in
  newest-first, with names on `named` prompts via `nameMap()`)
- **Show the class** toggle (the `reveal` flag), styled as a distinct, deliberate control
- **Close this prompt** to end it

### Components

```
src/pages/Live.tsx                        the class page
src/pages/manage/SessionLive.tsx          KC's console
src/components/live/PromptInput.tsx       renders single | multi | text
src/components/live/AttributionBanner.tsx states the attribution rule before anyone answers
src/components/live/TallyBars.tsx         shared: KC's console + revealed class view
src/lib/useLiveRefresh.ts                 visibility-aware interval refetch
```

### `src/data/cwass.ts` additions

New `// ---- live prompts ----` section, matching the file's existing style (thin async wrappers,
`(data as T) ?? []`):

```
openPrompt()                       -> LivePrompt | null       the one open prompt, for the class
optionsForPrompt(promptId)         -> LiveOption[]
livePromptsForSession(sessionId)   -> LivePrompt[]            admin, includes drafts
createLivePrompt / updateLivePrompt / deleteLivePrompt
createLiveOption / updateLiveOption / deleteLiveOption
openLivePrompt(id)                 -> rpc('open_live_prompt')
closeLivePrompt(id)
submitLiveResponse({ prompt_id, option_ids, body, author_id })
myLiveResponses(promptId, userId)  -> LiveResponse[]          named prompts only
liveResponses(promptId)            -> LiveResponse[]          admin, raw
liveTally(promptId)                -> LiveTallyRow[]          class, revealed only
```

`submitLiveResponse` inserts one row per selected option. For a `named` prompt it first deletes
the user's existing rows for that prompt, so re-answering replaces rather than double-counts.
For `anonymous` it just inserts, and writes `cwass.live.<promptId>` to `localStorage` as the
device guard.

## KC's flow on a Sunday

1. **Before class** — `/manage/s/:id/live`. Add the prompts he expects to use, each with its type,
   options, and attribution mode. They sit in `draft`, invisible to everyone.
2. **Start of class** — tap **Go live**. Tell people to open the app; the `/this-week` pill
   ("Class is live right now") takes them to `/live`, which shows "We're live".
3. **At the moment** — present the slide, tap the prompt, tap **Send to the class**. Within ~4s
   every device shows the buttons.
4. **Watching** — tallies update every 2s, alongside "N on the app / M responded".
5. **Optionally** — **Show the class** to put the tally on their devices.
6. **Close the prompt.** Move on. Next one when he wants it.
7. **End of class** — **End live session**. That closes any open prompt and returns `/live` to
   its idle card.

The option text lives in both his slides and the prompt. That's fine and probably good — the
slide is the readable version, the buttons are the tappable one.

## Colour

**Green means live.** Red was the first instinct for a broadcast indicator, but in a chapel it
reads as error or alarm — the opposite of the calm "we're gathered and this is working" the state
actually means. Live pills, the console's live panel, and **Go live** are all emerald.

Two consequences: **End live session** is neutral dark (`bg-ink`) rather than red, since ending
is a normal step, not a failure; and the **Show the class** toggle uses brand blue when active,
so green is never ambiguous between "we're live" and "results are revealed".

## Risks & mitigations

- **Sign-in friction at the worst moment.** RLS requires `authenticated`, so a member who has
  never signed in faces a magic-link round trip mid-lesson. Mitigation for v1: sessions persist
  (`persistSession: true`) and most people will already be signed in from the week's study. Ask
  people to sign in *before* the first live prompt, not during. If this bites in practice, see
  Deferred.
- **Stale app shell.** The PWA precaches the app shell (`registerType: 'autoUpdate'`), but no
  runtime caching rule covers Supabase requests, so live data is always fetched from the network.
  A member running a very old build could still miss the `/live` route entirely — worth one
  end-to-end check on a phone after the first deploy, before relying on it in class.
- **Accidental reveal.** The `reveal` toggle changes what ~20 devices display. Style it as a
  deliberate, distinct control, not a checkbox next to the close button.
- **Empty room.** If nobody responds, the run view shows "0 responses" — which is information,
  not an error, and shouldn't look like one.
- **The honor-system caveat.** Anonymous tallies are approximate by construction. KC should read
  them as a signal, not a count. That's consistent with how he intends to use them.

## What shipped

- `0014_live_prompts.sql` — tables, RLS, `live_tallies` view, `set_live_session` /
  `open_live_prompt` / `close_live_prompt`
- `0015_live_presence_rpc.sql` — the `live_heartbeat()` RPC (see below)
- `src/lib/types.ts`, `src/data/cwass.ts` — types and data functions
- `/live`, `/manage/s/:id/live`, the `/this-week` pill, the session-row "Live prompts" link

**Verification.** `supabase/tests/live_prompts_rls.sql` impersonates a real non-admin member and
asserts 20 properties — drafts hidden, cross-member reads blocked, identity spoofing blocked,
anonymous prompts refusing an `author_id`, un-revealed tallies hidden, members unable to open a
prompt or go live. Its first check confirms `auth.uid()` actually resolves; without that, every
"blocked" result would pass vacuously. Re-runnable, cleans up its own fixture.

It caught one real bug before class: the presence heartbeat used `.upsert()`, which emits
`INSERT ... ON CONFLICT DO UPDATE` and needs read access to the conflicting row — which members
deliberately don't have. It failed under RLS. `0015` moved it to a `security definer` RPC that
takes no arguments, so members now need no direct privileges on `live_presence` at all.

## Deferred (schema already accommodates)

- **Scale / ranking types** — add to the `kind` check constraint; response rows unchanged.
- **Text reveal** — showing the class everyone's comments. Needs the `attribution_ok`-style
  per-student consent that v1 deliberately omits, plus a `shared_live_text` view. Don't ship the
  reveal without the consent.
- **Realtime transport** — swap what triggers the refetch.
- **Unauthenticated responses** — would remove the sign-in cliff, at the cost of opening a
  write path with no identity behind it. Only if the friction proves real.
- **Post-class artifact** — folding live responses into the "where the discussion went" recap
  already on the README roadmap.

## Resolved (were open questions)

1. **A closed prompt stays on screen only if it revealed a tally** — then it holds until KC opens
   the next one or ends the session, so a result doesn't vanish mid-read. With nothing revealed
   there is nothing to keep reading, so `/live` returns to the waiting card.
   `currentClassPrompt()` fetches the most recently *opened* prompt whether open or closed; the
   page then decides via `showPrompt = isOpen || showTally`.
2. **Prompts are not reusable across sessions.** Copy-paste is fine; reuse isn't worth the IA.
3. **`/live` is reachable regardless of the publish flag.** It keys off `is_live`, not
   `is_published`, so KC can run live prompts against a session he hasn't published.
