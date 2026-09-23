// Imports a lesson exported from claude.ai/design into the site.
//   pnpm import-deck "<folder or .dc.html file>" [--replace <id>] [--publish]
// Signs in as the admin account with IMPORT_EMAIL / IMPORT_PASSWORD (set them in .env.local);
// the service-role key is never used here.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { parseDeck, rewriteAssets } from '../src/decks/parse.ts';

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
const replace = args.includes('--replace') ? Number(args[args.indexOf('--replace') + 1]) : null;
const publish = args.includes('--publish');
if (!target) {
  console.error('Usage: pnpm import-deck "<folder or .dc.html file>" [--replace <id>] [--publish]');
  process.exit(1);
}
const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, IMPORT_EMAIL, IMPORT_PASSWORD } = process.env;
for (const [name, value] of Object.entries({ VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, IMPORT_EMAIL, IMPORT_PASSWORD }))
  if (!value) throw new Error(`Missing ${name} — put it in .env.local`);

const path = resolve(target);
const file = statSync(path).isDirectory()
  ? join(path, readdirSync(path).find((n) => n.endsWith('.dc.html')) ?? readdirSync(path).find((n) => n.endsWith('.html')) ?? '')
  : path;
if (!file || !statSync(file).isFile()) throw new Error(`No .dc.html lesson found in ${target}`);
const deck = parseDeck(readFileSync(file, 'utf8'), basename(file).replace(/\.(dc\.)?html$/, ''));
console.log(`"${deck.title}" — ${deck.slides.length} slides, ${deck.assets.length} local image(s)`);

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { error: authError } = await supabase.auth.signInWithPassword({ email: IMPORT_EMAIL, password: IMPORT_PASSWORD });
if (authError) throw new Error(`Could not sign in as ${IMPORT_EMAIL}: ${authError.message}`);

const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif' };
const slug = deck.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lesson';
const map = {};
for (const ref of deck.assets) {
  const source = resolve(file, '..', ref);
  const key = `${slug}/${basename(ref)}`;
  const { error } = await supabase.storage.from('deck-media').upload(key, readFileSync(source), {
    upsert: true,
    contentType: types[extname(ref).toLowerCase()] || 'application/octet-stream',
  });
  if (error) throw new Error(`Could not upload ${ref}: ${error.message}`);
  map[ref] = supabase.storage.from('deck-media').getPublicUrl(key).data.publicUrl;
  console.log(`  uploaded ${ref}`);
}

const { data: id, error } = await supabase.rpc('deck_save', {
  p_deck: {
    id: replace,
    title: deck.title,
    subtitle: deck.subtitle,
    slides: deck.slides.map((s) => ({ label: s.label, html: rewriteAssets(s.html, map) })),
  },
});
if (error) throw new Error(`Could not save the lesson: ${error.message}`);
if (publish) {
  const { error: publishError } = await supabase.rpc('deck_publish', { p_id: id, p_published: true });
  if (publishError) throw new Error(`Saved as lesson ${id} but could not publish: ${publishError.message}`);
}
console.log(`Saved as lesson ${id}${publish ? ', published for the class' : ' (not published yet)'}. Present it from /manage.`);
