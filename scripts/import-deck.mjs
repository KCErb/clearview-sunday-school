// Imports a lesson exported from claude.ai/design into the site.
//
//   pnpm import-deck <folder or .dc.html> [options]
//
//   --title "…" / --subtitle "…"   override what the parser reads off the title slide
//   --replace <id>                 re-import over an existing lesson (keeps notes and attached questions)
//   --publish                      show it to the class straight away
//   --local-assets                 copy images into public/decks/<slug>/ so the site serves them
//                                  (otherwise they are uploaded to the deck-media storage bucket)
//   --sql <file>                   write the SQL instead of calling the API; run it with
//                                  `python3 scripts/supabase-query.py <file>` (no password needed)
//
// Without --sql it signs in as the admin account with IMPORT_EMAIL / IMPORT_PASSWORD from
// .env.local. The service-role key is never used.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDeck, readTokens, rewriteAssets } from '../src/decks/parse.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined);
const valued = new Set(['title', 'subtitle', 'replace', 'sql']);
const target = args.find((a, i) => !a.startsWith('--') && !valued.has((args[i - 1] || '').slice(2)));
if (!target) {
  console.error('Usage: pnpm import-deck <folder or .dc.html> [--title …] [--subtitle …] [--replace <id>] [--publish] [--local-assets] [--sql <file>]');
  process.exit(1);
}

const path = resolve(target);
const file = statSync(path).isDirectory()
  ? join(path, readdirSync(path).find((n) => n.endsWith('.dc.html')) ?? readdirSync(path).find((n) => n.endsWith('.html')) ?? '')
  : path;
if (!existsSync(file) || !statSync(file).isFile()) throw new Error(`No .dc.html lesson found in ${target}`);

const tokenDir = join(root, 'Church Design System/tokens');
const tokens = readTokens(...readdirSync(tokenDir).map((n) => readFileSync(join(tokenDir, n), 'utf8')));
const deck = parseDeck(readFileSync(file, 'utf8'), basename(file).replace(/\.(dc\.)?html$/, ''), tokens);
const title = option('title') ?? deck.title;
const subtitle = option('subtitle') ?? deck.subtitle;
const replace = option('replace') ? Number(option('replace')) : null;
console.log(`"${title}" — ${deck.slides.length} slides, ${deck.assets.length} local image(s)`);
for (const w of deck.warnings) console.warn(`  ! could not expand design-system component: ${w}`);

const slug = (basename(dirname(file)) + '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lesson';
const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif' };
const map = {};
const missing = [];
let supabase = null;
async function client() {
  if (supabase) return supabase;
  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, IMPORT_EMAIL, IMPORT_PASSWORD } = process.env;
  for (const [name, value] of Object.entries({ VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, IMPORT_EMAIL, IMPORT_PASSWORD }))
    if (!value) throw new Error(`Missing ${name} — put it in .env.local, or use --sql`);
  const { createClient } = await import('@supabase/supabase-js');
  supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.auth.signInWithPassword({ email: IMPORT_EMAIL, password: IMPORT_PASSWORD });
  if (error) throw new Error(`Could not sign in as ${IMPORT_EMAIL}: ${error.message}`);
  return supabase;
}

for (const ref of deck.assets) {
  const source = resolve(dirname(file), ref);
  const name = basename(ref);
  if (flag('local-assets')) {
    // Stable addresses: dropping a missing image in later needs a deploy, not a re-import.
    map[ref] = `/decks/${slug}/${name}`;
    if (existsSync(source)) {
      mkdirSync(join(root, 'public/decks', slug), { recursive: true });
      copyFileSync(source, join(root, 'public/decks', slug, name));
      console.log(`  copied ${ref} → public/decks/${slug}/${name}`);
    } else missing.push(ref);
    continue;
  }
  if (!existsSync(source)) {
    missing.push(ref);
    continue;
  }
  const api = await client();
  const key = `${slug}/${name}`;
  const { error } = await api.storage.from('deck-media').upload(key, readFileSync(source), {
    upsert: true,
    contentType: types[extname(ref).toLowerCase()] || 'application/octet-stream',
  });
  if (error) throw new Error(`Could not upload ${ref}: ${error.message}`);
  map[ref] = api.storage.from('deck-media').getPublicUrl(key).data.publicUrl;
  console.log(`  uploaded ${ref}`);
}
for (const ref of missing) console.warn(`  ! image not found beside the lesson: ${ref}`);

const payload = {
  id: replace,
  title,
  subtitle,
  slides: deck.slides.map((s) => ({ label: s.label, html: rewriteAssets(s.html, map) })),
};

if (option('sql')) {
  const json = JSON.stringify(payload);
  if (json.includes('$deck$')) throw new Error('Lesson text contains the SQL quote marker $deck$');
  // deck_save is admin-only; inside this one transaction the query acts as the admin's JWT.
  const sql = [
    'begin;',
    `select set_config('request.jwt.claims', '{"email":"iamkcerb@gmail.com"}', true);`,
    `create temp table imported on commit drop as select public.deck_save($deck$${json}$deck$::jsonb) as id;`,
    flag('publish') ? 'select public.deck_publish(id, true) from imported;' : '',
    'select id from imported;',
    'commit;',
  ].join('\n');
  writeFileSync(option('sql'), sql);
  console.log(`Wrote ${option('sql')} — run: python3 scripts/supabase-query.py ${option('sql')}`);
} else {
  const api = await client();
  const { data: id, error } = await api.rpc('deck_save', { p_deck: payload });
  if (error) throw new Error(`Could not save the lesson: ${error.message}`);
  if (flag('publish')) {
    const { error: publishError } = await api.rpc('deck_publish', { p_id: id, p_published: true });
    if (publishError) throw new Error(`Saved as lesson ${id} but could not publish: ${publishError.message}`);
  }
  console.log(`Saved as lesson ${id}${flag('publish') ? ', published for the class' : ' (not published yet)'}. Present it from /manage.`);
}
