-- ─── Pujo Sahayak: moderation reliability + server-trusted commerce ──────────
-- Forward migration on top of 001_initial_schema.sql (001 is already applied on
-- live projects, so it is never edited in place). Run via `supabase db push` or
-- paste in the SQL editor.
--
--   1. Live notes now enter the pipeline as 'pending' — clients can no longer
--      publish themselves. run_note_moderation() is the only publisher.
--   2. Reporting is one atomic, idempotent RPC (001-era clients called an
--      'increment_note_reports' RPC that was never defined anywhere).
--   3. Orders and transactions stop trusting client-supplied amounts/statuses:
--      direct INSERT policies are dropped and replaced by SECURITY DEFINER
--      RPCs that derive every money field from trusted server rows.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. LIVE NOTES — honest moderation pipeline
-- ═══════════════════════════════════════════════════════════════════════════

-- New notes start pending. Previously the DEFAULT was 'approved' AND the client
-- inserted 'approved' explicitly, while the moderation job's rate-limit branch
-- acted on 'pending' rows that posting could never create.
ALTER TABLE live_notes ALTER COLUMN moderation_status SET DEFAULT 'pending';

-- The author must be able to see their own note while it awaits moderation
-- (the feed renders an honest "Awaiting moderation" chip). Everyone else still
-- sees only approved notes.
DROP POLICY "live_notes_read" ON live_notes;
CREATE POLICY "live_notes_read" ON live_notes FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = author_id);

-- One report per (reporter, live_note) pair. A partial index keeps the other
-- user_reports target types (place_info, missing person…) unconstrained.
CREATE UNIQUE INDEX uniq_live_note_reports
  ON user_reports (reporter_id, target_type, target_id)
  WHERE target_type = 'live_note';

-- Missing-person reports: the client posts target_type = 'missing_person', but
-- 001's CHECK constraint did not allow the value, so every such insert failed
-- on the database while the UI still reported success. The constraint is
-- widened to what the code actually writes (002 has never been applied to any
-- project, so it is corrected in place instead of stacking a forward migration).
ALTER TABLE user_reports DROP CONSTRAINT IF EXISTS user_reports_target_type_check;
ALTER TABLE user_reports
  ADD CONSTRAINT user_reports_target_type_check
  CHECK (target_type IN ('live_note','product','user','order','place_info','missing_person','authority_info'));

-- Atomic, idempotent report: inserts the report row AND bumps the note's
-- reported_count in one server-side call, so neither half can silently fail
-- the way the old two-request client flow could. SECURITY DEFINER so the
-- reported_count update crosses into live_notes under one policy check.
CREATE OR REPLACE FUNCTION report_live_note(p_note_id uuid, p_reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rows int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  -- The arbiter must repeat the partial index's predicate, or Postgres cannot
  -- infer the constraint and raises 42P10 ("no unique or exclusion constraint
  -- matching the ON CONFLICT specification") on every call.
  INSERT INTO user_reports (reporter_id, target_type, target_id, reason)
  VALUES (v_uid, 'live_note', p_note_id::text, coalesce(nullif(trim(p_reason), ''), 'unspecified'))
  ON CONFLICT (reporter_id, target_type, target_id) WHERE target_type = 'live_note'
    DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  -- Only bump the counter when the report is new: repeat reports by the same
  -- user must not inflate the auto-reject threshold.
  IF v_rows > 0 THEN
    UPDATE live_notes
       SET reported_count = reported_count + 1
     WHERE id = p_note_id;
  END IF;

  RETURN v_rows > 0;
END
$$;

-- Atomic helpful increment. Replaces the client's read-modify-write, which
-- raced (two taps could read the same count and write back one increment).
CREATE OR REPLACE FUNCTION increment_note_helpful(p_note_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE live_notes
     SET helpful_count = helpful_count + 1
   WHERE id = p_note_id AND moderation_status = 'approved'
  RETURNING helpful_count INTO v_count;
  IF v_count IS NULL THEN
    RAISE EXCEPTION 'note not found or not visible';
  END IF;
  RETURN v_count;
END
$$;

-- The scheduled moderation pass. Every state the pipeline can reach is handled
-- here, so the job operates only on states posting can actually create:
--   pending ──approve──▶ approved ──expire──▶ expired
--   pending ──rate-limited author──▶ rejected
--   approved (3+ reports) ──▶ rejected
-- Lives in SQL because the Edge Function's old supabase-js `.group()/.having()`
-- aggregate is not a real PostgREST builder call and threw at runtime.
CREATE OR REPLACE FUNCTION run_note_moderation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired int;
  v_rejected int;
  v_rate_rejected int;
  v_approved int;
BEGIN
  UPDATE live_notes SET moderation_status = 'expired'
   WHERE moderation_status = 'approved' AND expires_at < now();
  GET DIAGNOSTICS v_expired = ROW_COUNT;

  UPDATE live_notes SET moderation_status = 'rejected'
   WHERE moderation_status = 'approved' AND reported_count >= 3;
  GET DIAGNOSTICS v_rejected = ROW_COUNT;

  -- Rate limit: authors with more than 5 notes in the last hour have their
  -- still-pending notes rejected as a soft penalty.
  UPDATE live_notes SET moderation_status = 'rejected'
   WHERE moderation_status = 'pending'
     AND author_id IN (
       SELECT author_id FROM live_notes
        WHERE created_at >= now() - interval '1 hour' AND author_id IS NOT NULL
        GROUP BY author_id HAVING count(*) > 5
     );
  GET DIAGNOSTICS v_rate_rejected = ROW_COUNT;

  -- Publish the remainder of the queue. Human review remains possible via
  -- user_reports; this is the MVP auto-moderator.
  UPDATE live_notes SET moderation_status = 'approved'
   WHERE moderation_status = 'pending' AND reported_count < 3;
  GET DIAGNOSTICS v_approved = ROW_COUNT;

  RETURN jsonb_build_object(
    'expired', v_expired,
    'rejected', v_rejected,
    'rate_limited_rejected', v_rate_rejected,
    'approved', v_approved
  );
END
$$;

-- Grants: report/helpful are client-facing (signed-in users only); the
-- moderation pass is service-role only (invoked by the scheduled Edge
-- Function), never from a user session. Postgres 15 stops granting function
-- EXECUTE to PUBLIC by default, so the service-role grant is stated
-- explicitly — the Edge Function authenticates as service_role and would
-- otherwise fail the RPC with a permission error.
REVOKE ALL ON FUNCTION report_live_note(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION report_live_note(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION increment_note_helpful(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_note_helpful(uuid) TO authenticated;
REVOKE ALL ON FUNCTION run_note_moderation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION run_note_moderation() TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. COMMERCE — amounts & statuses are server-controlled
-- ═══════════════════════════════════════════════════════════════════════════
-- Boundary for a future real payment integration: clients may never declare an
-- order amount, a transaction amount, or any financial status — those are read
-- from trusted rows (marketplace_products.price → order → transaction) inside
-- these RPCs. Today the RPCs only create DEMO records (is_demo = true); to go
-- live, swap their bodies for gateway-verified equivalents (create intent
-- server-side, mark completed only on a verified webhook). No UI or client
-- call shape changes.

-- Clients can no longer insert orders or transactions directly.
DROP POLICY IF EXISTS "orders_insert" ON marketplace_orders;
DROP POLICY IF EXISTS "txn_own_insert" ON transactions;

-- Place a demo order. Amount comes from the product row, status is fixed.
CREATE OR REPLACE FUNCTION place_demo_order(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_product marketplace_products%ROWTYPE;
  v_order marketplace_orders%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT * INTO v_product FROM marketplace_products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'product not found';
  END IF;
  IF v_product.availability = 'out_of_stock' THEN
    RAISE EXCEPTION 'product is out of stock';
  END IF;

  INSERT INTO marketplace_orders (product_id, buyer_id, amount, status)
  VALUES (v_product.id, v_uid, v_product.price, 'initiated')
  RETURNING * INTO v_order;

  RETURN to_jsonb(v_order);
END
$$;

-- Confirm the DEMO payment for an owned order. The transaction amount is
-- copied from the ORDER row (never from the caller), the status is fixed to
-- 'demo_completed', and is_demo is always true. Idempotent: a second call
-- returns the existing transaction instead of duplicating it.
CREATE OR REPLACE FUNCTION confirm_demo_payment(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order marketplace_orders%ROWTYPE;
  v_txn transactions%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT * INTO v_order FROM marketplace_orders
   WHERE id = p_order_id AND buyer_id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found';
  END IF;

  SELECT * INTO v_txn FROM transactions
   WHERE order_id = v_order.id AND user_id = v_uid AND type = 'purchase'
   ORDER BY created_at LIMIT 1;
  IF FOUND THEN
    RETURN to_jsonb(v_txn);  -- already paid — return the original, no new row
  END IF;

  INSERT INTO transactions (user_id, order_id, type, amount, currency, status, provider_txn_id, is_demo)
  VALUES (v_uid, v_order.id, 'purchase', v_order.amount, 'INR', 'demo_completed',
          'demo_' || gen_random_uuid()::text, true)
  RETURNING * INTO v_txn;

  UPDATE marketplace_orders SET status = 'confirmed', updated_at = now()
   WHERE id = v_order.id;

  RETURN to_jsonb(v_txn);
END
$$;

-- Refund a DEMO transaction, own rows only, and only from a demo/pending
-- state — the client can never mark an arbitrary transaction refunded.
CREATE OR REPLACE FUNCTION refund_demo_payment(p_txn_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_txn transactions%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT * INTO v_txn FROM transactions
   WHERE id = p_txn_id AND user_id = v_uid AND is_demo = true
     AND status IN ('demo_completed', 'pending');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no refundable demo transaction';
  END IF;

  UPDATE transactions SET status = 'refunded' WHERE id = v_txn.id;
  UPDATE marketplace_orders SET status = 'cancelled', updated_at = now()
   WHERE id = v_txn.order_id;

  RETURN jsonb_build_object('refunded', true, 'txn_id', v_txn.id);
END
$$;

REVOKE ALL ON FUNCTION place_demo_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION place_demo_order(uuid) TO authenticated;
REVOKE ALL ON FUNCTION confirm_demo_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION confirm_demo_payment(uuid) TO authenticated;
REVOKE ALL ON FUNCTION refund_demo_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION refund_demo_payment(uuid) TO authenticated;
