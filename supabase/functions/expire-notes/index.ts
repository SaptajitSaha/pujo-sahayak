// Supabase Edge Function: expire stale live notes + auto-moderate.
// Schedule via pg_cron or Supabase's built-in cron: every 10 minutes.
//
// deno run --allow-env --allow-net index.ts (local testing)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 1. Expire notes past their TTL
  const { count: expired } = await supabase
    .from('live_notes')
    .update({ moderation_status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .eq('moderation_status', 'approved')

  // 2. Auto-reject notes reported 3+ times
  const { count: rejected } = await supabase
    .from('live_notes')
    .update({ moderation_status: 'rejected' })
    .gte('reported_count', 3)
    .eq('moderation_status', 'approved')

  // 3. Rate-limit enforcement: flag users with >5 notes in the last hour
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { data: flagged } = await supabase
    .from('live_notes')
    .select('author_id')
    .gte('created_at', oneHourAgo)
    .group('author_id')
    .having('count', 'gt', 5)

  if (flagged && flagged.length > 0) {
    // Reject their most recent pending notes as a soft penalty
    for (const { author_id } of flagged) {
      await supabase
        .from('live_notes')
        .update({ moderation_status: 'rejected' })
        .eq('author_id', author_id)
        .eq('moderation_status', 'pending')
    }
  }

  return Response.json({
    expired: expired ?? 0,
    rejected: rejected ?? 0,
    rate_limited_users: flagged?.length ?? 0,
  })
})
