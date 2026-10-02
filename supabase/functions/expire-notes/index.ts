// Supabase Edge Function: scheduled live-notes moderation + expiry pass.
// Schedule via pg_cron or Supabase's built-in cron: every 10 minutes.
//
// Authorization model — this function holds the service-role key, so it must
// never answer unauthenticated callers. Only a caller presenting the shared
// scheduler secret may run it:
//
//   POST /functions/v1/expire-notes
//   headers: { "x-scheduler-secret": "<MODERATION_SCHEDULER_SECRET>" }
//
// Set MODERATION_SCHEDULER_SECRET in the function's env
// (`supabase secrets set MODERATION_SCHEDULER_SECRET=...`). The secret travels
// over HTTPS; rotate it if it ever leaks. The service-role key stays inside the
// function's own env and is never returned to or shared with a client.
//
// All moderation state transitions live in the database (run_note_moderation,
// supabase/migrations/002_*.sql) so rate limits and thresholds are enforced
// atomically in one transaction. The previous version aggregated per-author
// counts with supabase-js `.group()/.having()` — calls that don't exist on the
// PostgREST builder and threw at runtime with the error discarded.
//
// deno run --allow-env --allow-net index.ts (local testing)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const secret = Deno.env.get('MODERATION_SCHEDULER_SECRET')
  if (!secret) {
    // Misconfiguration must fail loudly, not silently run wide open.
    console.error('MODERATION_SCHEDULER_SECRET is not set — refusing to run')
    return Response.json({ error: 'scheduler not configured' }, { status: 500 })
  }
  if (req.headers.get('x-scheduler-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data, error } = await supabase.rpc('run_note_moderation')
  if (error) {
    // Log the detail server-side; return a generic message so the response
    // can't echo schema information to a caller.
    console.error('run_note_moderation failed:', error.message)
    return Response.json({ error: 'moderation run failed' }, { status: 500 })
  }

  return Response.json(data ?? {})
})
