const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/poll_current`, {
  method: 'POST',
  headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
  body: '{}',
  signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw new Error(`Polling backend is not ready: HTTP ${response.status}`);
const poll = await response.json();
if (poll !== null && (!poll.id || !Array.isArray(poll.options)))
  throw new Error('Unexpected polling backend response');
const suggestions = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/poll_my_write_ins`, {
  method: 'POST',
  headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ p_id: -1, p_token: crypto.randomUUID().repeat(2) }),
  signal: AbortSignal.timeout(15000),
});
if (!suggestions.ok || !Array.isArray(await suggestions.json()))
  throw new Error('Private write-in backend is not ready');
console.log('Anonymous polling and private write-in backends are ready.');
