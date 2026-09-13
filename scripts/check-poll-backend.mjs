const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/poll_current`, {
  method: 'POST', headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw new Error(`Polling backend is not ready: HTTP ${response.status}`);
const poll = await response.json();
if (poll !== null && (!poll.id || !Array.isArray(poll.options))) throw new Error('Unexpected polling backend response');
console.log('Anonymous polling backend is ready.');
