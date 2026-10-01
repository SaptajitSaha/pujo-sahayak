-- ─── Pujo Sahayak: initial schema (five-feature extension) ───────────────────
-- Run via `supabase db push` or paste in the SQL editor.

-- ═══════════════════════════════════════════════════════════════════════════════
-- FEATURE 1: Community Live Notes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS live_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 200),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '2 hours',
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending','approved','rejected','expired')),
  helpful_count INT DEFAULT 0,
  reported_count INT DEFAULT 0
);

CREATE INDEX idx_live_notes_place ON live_notes (place_id, created_at DESC)
  WHERE moderation_status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════════
-- FEATURE 5: Authority / Official Notices
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS official_notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id TEXT NOT NULL,
  source TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  verification_status TEXT DEFAULT 'official' CHECK (verification_status IN ('unverified','verified','official'))
);

CREATE INDEX idx_official_notices_place ON official_notices (place_id, created_at DESC);

CREATE TABLE IF NOT EXISTS authority_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('police','traffic','medical','pandal_ops','government')),
  api_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS authority_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES authority_providers(id) ON DELETE SET NULL,
  place_id TEXT,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('emergency','traffic','closure','safety','medical','operational')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_authority_alerts_place ON authority_alerts (place_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FEATURE 2: Social Matching
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS social_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  interests TEXT[] DEFAULT '{}',
  preferred_areas TEXT[] DEFAULT '{}',
  preferred_time TEXT DEFAULT 'evening',
  crowd_preference TEXT DEFAULT 'moderate',
  language_preference TEXT DEFAULT 'en',
  outing_style TEXT DEFAULT 'explorer',
  planned_tithi TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public','hidden')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FEATURE 3: Marketplace
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('clothing','accessories','puja_essentials','handmade','experiences','partner_offers')),
  price INT NOT NULL CHECK (price >= 0),
  description TEXT,
  images TEXT[] DEFAULT '{}',
  availability TEXT DEFAULT 'in_stock' CHECK (availability IN ('in_stock','out_of_stock','limited')),
  area TEXT,
  partner_status TEXT DEFAULT 'independent' CHECK (partner_status IN ('independent','partner','verified')),
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_marketplace_category ON marketplace_products (category, created_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES marketplace_products(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated','confirmed','shipped','delivered','cancelled')),
  amount INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON marketplace_orders (buyer_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FEATURE 4: Wallet / Payments
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES marketplace_orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase','refund','subscription','donation')),
  amount INT NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded','demo_completed')),
  provider_txn_id TEXT,
  is_demo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_user ON transactions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('upi','card','netbanking','wallet')),
  last4 TEXT,
  provider_token TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MODERATION (shared across features)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('live_note','product','user','order')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','reviewed','actioned','dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reports_target ON user_reports (target_type, target_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- REALTIME PUBLICATION
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE live_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE official_notices;
ALTER PUBLICATION supabase_realtime ADD TABLE authority_alerts;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

-- Live notes: anyone reads approved; author writes; anyone reports.
ALTER TABLE live_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_notes_read" ON live_notes FOR SELECT USING (moderation_status = 'approved');
CREATE POLICY "live_notes_insert" ON live_notes FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "live_notes_delete_own" ON live_notes FOR DELETE USING (auth.uid() = author_id);

-- Official notices: public read; admin writes (no auth.uid() check for MVP).
ALTER TABLE official_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notices_read" ON official_notices FOR SELECT USING (true);

-- Authority providers + alerts: public read; admin writes.
ALTER TABLE authority_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers_read" ON authority_providers FOR SELECT USING (true);

ALTER TABLE authority_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_read" ON authority_alerts FOR SELECT USING (true);

-- Social preferences: user CRUDs own; public reads visible profiles.
ALTER TABLE social_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs_read_visible" ON social_preferences FOR SELECT USING (visibility = 'public');
CREATE POLICY "prefs_own_all" ON social_preferences FOR ALL USING (auth.uid() = user_id);

-- Marketplace: public reads products; authenticated creates orders; own orders visible.
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_read" ON marketplace_products FOR SELECT USING (true);

ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_own_read" ON marketplace_orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "orders_insert" ON marketplace_orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Transactions: own read only.
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "txn_own_read" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "txn_own_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment methods: own CRUD.
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_own_all" ON payment_methods FOR ALL USING (auth.uid() = user_id);

-- User reports: authenticated insert; no public read (admin only).
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert" ON user_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
