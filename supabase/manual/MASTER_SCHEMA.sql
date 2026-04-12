-- ================================================================
-- GAMASA PROPERTIES — MASTER SCHEMA (النسخة النهائية المنظفة)
-- ================================================================
-- الاستخدام: افتح Supabase Dashboard ← SQL Editor وشغّل هذا الملف كله
-- هذا الملف يدمج جميع الـ migrations القديمة في ملف واحد نظيف
-- آخر تحديث: 2026-03-11
-- ================================================================


-- MANUAL SNAPSHOT NOTE:
-- This file bootstraps a brand-new project through Dashboard SQL Editor.
-- Do not run numbered migrations manually on top of it in the same setup flow.

-- ============================================================
-- SECTION 1: الجداول الأساسية (Tables)
-- ============================================================

-- 1.1 جدول الملفات الشخصية (Profiles)
-- MANUAL SNAPSHOT:
-- Run this file only for a fresh Supabase project through SQL Editor.
-- Do not run it on an existing project that already uses migrations.
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name       TEXT,
  avatar_url      TEXT,
  phone           TEXT,
  national_id     TEXT,
  role            TEXT    NOT NULL DEFAULT 'tenant'
                          CHECK (role IN ('tenant', 'landlord', 'admin')),
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 جدول العقارات (Properties)
CREATE TABLE IF NOT EXISTS public.properties (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT,
  price           DECIMAL     NOT NULL,
  price_unit      TEXT        NOT NULL DEFAULT 'day'
                              CHECK (price_unit IN ('day', 'week', 'month', 'season')),
  category        TEXT        CHECK (category IN ('apartment', 'room', 'studio', 'villa', 'chalet', 'office', 'land')),
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'available', 'rented', 'rejected')),
  location_lat    DOUBLE PRECISION,
  location_lng    DOUBLE PRECISION,
  address         TEXT,
  area            TEXT,
  bedrooms        INTEGER     DEFAULT 1,
  bathrooms       INTEGER     DEFAULT 1,
  floor_area      INTEGER,
  floor_number    INTEGER     DEFAULT 0,
  features        TEXT[]      DEFAULT '{}',
  images          TEXT[]      DEFAULT '{}',
  owner_phone     TEXT,
  owner_name      TEXT,
  is_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
  views_count     INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 جدول الحجوزات (Bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID        REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date      DATE        NOT NULL,
  end_date        DATE        NOT NULL,
  total_nights    INTEGER,
  total_months    INTEGER,
  rental_type     TEXT        CHECK (rental_type IN ('daily', 'monthly', 'seasonal')),
  tenant_name     TEXT,
  tenant_phone    TEXT,
  tenant_email    TEXT,
  base_price      DECIMAL,
  service_fee     DECIMAL,
  deposit_amount  DECIMAL,
  total_price     DECIMAL,
  total_amount    DECIMAL     NOT NULL DEFAULT 0,
  payment_method  TEXT        CHECK (payment_method IN ('vodafone_cash', 'instapay', 'cash_on_delivery')),
  payment_status  TEXT        CHECK (payment_status IN ('pending', 'confirmed', 'failed')),
  payment_proof   TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN (
                                'pending', 'requested', 'confirmed',
                                'active', 'cancelled', 'completed',
                                'expired', 'rejected'
                              )),
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 جدول طلبات الدفع (Payment Requests)
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id     UUID        REFERENCES public.properties(id) ON DELETE CASCADE,
  amount          DECIMAL     NOT NULL,
  payment_method  TEXT        CHECK (payment_method IN ('vodafone_cash', 'instapay', 'fawry')),
  receipt_image   TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note      TEXT,
  is_consumed     BOOLEAN     NOT NULL DEFAULT FALSE,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 جدول التقييمات (Reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID        REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating          INTEGER     CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(property_id, user_id)
);

-- 1.6 جدول الإشعارات (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  message         TEXT,
  type            TEXT        CHECK (type IN ('success', 'info', 'warning', 'error')),
  is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
  link            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.7 جدول المفضلات (Favorites)
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id     UUID        REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, property_id)
);

-- 1.8 جدول العقارات المفتوحة (Unlocked Properties)
CREATE TABLE IF NOT EXISTS public.unlocked_properties (
  user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id     UUID        REFERENCES public.properties(id) ON DELETE CASCADE,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, property_id)
);

-- 1.9 جدول المحادثات (Conversations)
CREATE TABLE IF NOT EXISTS public.conversations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID        REFERENCES public.properties(id) ON DELETE SET NULL,
  buyer_id        UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id        UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(property_id, buyer_id, owner_id)
);

-- 1.10 جدول الرسائل (Messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  text            TEXT        NOT NULL,
  message_type    TEXT        DEFAULT 'text',
  media_url       TEXT,
  duration        INTEGER,
  metadata        JSONB,
  is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.11 سجل حالة العقار (Property Status History)
CREATE TABLE IF NOT EXISTS public.property_status_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID        REFERENCES public.properties(id) ON DELETE CASCADE,
  old_status      TEXT,
  new_status      TEXT,
  changed_by      UUID        REFERENCES auth.users(id),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.12 سجل العمليات الإدارية (Admin Audit Logs)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action          TEXT        NOT NULL,
  actor_user_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_type     TEXT        NOT NULL,
  target_id       TEXT        NOT NULL,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_audit_logs_action_not_empty       CHECK (char_length(trim(action)) > 0),
  CONSTRAINT admin_audit_logs_target_type_not_empty  CHECK (char_length(trim(target_type)) > 0),
  CONSTRAINT admin_audit_logs_target_id_not_empty    CHECK (char_length(trim(target_id)) > 0)
);

-- 1.13 جدول بيانات التواصل للعقارات (Property Contacts)
CREATE TABLE IF NOT EXISTS public.property_contacts (
  property_id     UUID        PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_phone     TEXT        NOT NULL,
  owner_name      TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed property_contacts من العقارات الموجودة
INSERT INTO public.property_contacts (property_id, owner_phone, owner_name)
SELECT id, owner_phone, owner_name
FROM public.properties
WHERE owner_phone IS NOT NULL AND owner_name IS NOT NULL
ON CONFLICT (property_id) DO NOTHING;


-- ============================================================
-- SECTION 2: الفهارس (Indexes)
-- ============================================================

-- Properties
CREATE INDEX IF NOT EXISTS idx_properties_owner_id           ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status             ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at         ON public.properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_status_created_at  ON public.properties(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_category           ON public.properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_price              ON public.properties(price);

-- Bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user_id              ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id          ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status               ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates                ON public.bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user_created         ON public.bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_property_dates_status
  ON public.bookings(property_id, start_date, end_date, status)
  WHERE status IN ('confirmed', 'active');

-- Payment Requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_requests_property_user_active
  ON public.payment_requests(property_id, user_id)
  WHERE status = 'approved' AND is_consumed = FALSE;
CREATE INDEX IF NOT EXISTS idx_payment_requests_consumed
  ON public.payment_requests(user_id, property_id, status, is_consumed)
  WHERE status = 'approved';

-- Admin Audit Logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at   ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor_user_id ON public.admin_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target        ON public.admin_audit_logs(target_type, target_id);


-- ============================================================
-- SECTION 3: تفعيل Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_properties    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs       FORCE ROW LEVEL SECURITY;
ALTER TABLE public.property_contacts      ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SECTION 4: سياسات الأمان (RLS Policies)
-- ============================================================

-- ── Profiles ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ── Properties ────────────────────────────────────────────
DROP POLICY IF EXISTS "Approved properties are viewable by everyone" ON public.properties;
CREATE POLICY "Approved properties are viewable by everyone"
  ON public.properties FOR SELECT
  USING (status IN ('available', 'rented') OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
CREATE POLICY "Users can insert own properties"
  ON public.properties FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
CREATE POLICY "Users can update own properties"
  ON public.properties FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;
CREATE POLICY "Users can delete own properties"
  ON public.properties FOR DELETE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Admins can do everything on properties" ON public.properties;
CREATE POLICY "Admins can do everything on properties"
  ON public.properties FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND (profiles.role = 'admin' OR profiles.is_admin = TRUE))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND (profiles.role = 'admin' OR profiles.is_admin = TRUE))
  );

-- ── Bookings ──────────────────────────────────────────────
-- Tenants
DROP POLICY IF EXISTS "tenants_select_own_bookings" ON public.bookings;
CREATE POLICY "tenants_select_own_bookings"
  ON public.bookings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "tenants_insert_own_bookings" ON public.bookings;
CREATE POLICY "tenants_insert_own_bookings"
  ON public.bookings FOR INSERT WITH CHECK (user_id = auth.uid());

-- Landlords
DROP POLICY IF EXISTS "landlords_select_property_bookings" ON public.bookings;
CREATE POLICY "landlords_select_property_bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.properties p
            WHERE p.id = bookings.property_id AND p.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "landlords_update_property_bookings" ON public.bookings;
CREATE POLICY "landlords_update_property_bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.properties p
            WHERE p.id = bookings.property_id AND p.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties p
            WHERE p.id = bookings.property_id AND p.owner_id = auth.uid())
  );

-- Admins
DROP POLICY IF EXISTS "admins_select_bookings" ON public.bookings;
CREATE POLICY "admins_select_bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles pr
            WHERE pr.id = auth.uid() AND pr.role = 'admin')
  );

DROP POLICY IF EXISTS "admins_update_bookings" ON public.bookings;
CREATE POLICY "admins_update_bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles pr
            WHERE pr.id = auth.uid() AND pr.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles pr
            WHERE pr.id = auth.uid() AND pr.role = 'admin')
  );

DROP POLICY IF EXISTS "admins_delete_bookings" ON public.bookings;
CREATE POLICY "admins_delete_bookings"
  ON public.bookings FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles pr
            WHERE pr.id = auth.uid() AND pr.role = 'admin')
  );

-- ── Payment Requests ──────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
CREATE POLICY "Users can view own payment requests"
  ON public.payment_requests FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create payment requests" ON public.payment_requests;
CREATE POLICY "Users can create payment requests"
  ON public.payment_requests FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage payment requests" ON public.payment_requests;
CREATE POLICY "Admins can manage payment requests"
  ON public.payment_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND (profiles.role = 'admin' OR profiles.is_admin = TRUE))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND (profiles.role = 'admin' OR profiles.is_admin = TRUE))
  );

-- ── Reviews ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── Notifications ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND (profiles.role = 'admin' OR profiles.is_admin = TRUE))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND (profiles.role = 'admin' OR profiles.is_admin = TRUE))
  );

-- ── Favorites ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites"
  ON public.favorites FOR ALL USING (user_id = auth.uid());

-- ── Unlocked Properties ───────────────────────────────────
DROP POLICY IF EXISTS "Users can view own unlocked properties" ON public.unlocked_properties;
CREATE POLICY "Users can view own unlocked properties"
  ON public.unlocked_properties FOR SELECT USING (user_id = auth.uid());

-- ── Conversations ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can start conversations as buyer" ON public.conversations;
CREATE POLICY "Users can start conversations as buyer"
  ON public.conversations FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- ── Messages ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
CREATE POLICY "Users can view messages in own conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in own conversations" ON public.messages;
CREATE POLICY "Users can send messages in own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.owner_id = auth.uid())
    )
  );

-- ── Admin Audit Logs ──────────────────────────────────────
DROP POLICY IF EXISTS "admins_read_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "admins_read_audit_logs"
  ON public.admin_audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND (p.role = 'admin' OR p.is_admin = TRUE))
  );

DROP POLICY IF EXISTS "admins_insert_own_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "admins_insert_own_audit_logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (
    actor_user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND (p.role = 'admin' OR p.is_admin = TRUE))
  );

-- ── Property Contacts ─────────────────────────────────────
DROP POLICY IF EXISTS "Enable read access for property owners" ON public.property_contacts;
CREATE POLICY "Enable read access for property owners"
  ON public.property_contacts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.properties p
            WHERE p.id = property_contacts.property_id AND p.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Enable read access for users who unlocked the property" ON public.property_contacts;
CREATE POLICY "Enable read access for users who unlocked the property"
  ON public.property_contacts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.unlocked_properties up
            WHERE up.property_id = property_contacts.property_id AND up.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.property_contacts;
CREATE POLICY "Enable insert for authenticated users"
  ON public.property_contacts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');


-- ============================================================
-- SECTION 5: الدوال والمشغّلات (Functions & Triggers)
-- ============================================================

-- 5.1 إنشاء ملف شخصي تلقائياً عند التسجيل
-- (Non-blocking: أي خطأ يُسجَّل كـ WARNING ولا يمنع التسجيل)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_role TEXT;
  v_role     TEXT;
BEGIN
  v_raw_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  v_role := CASE
    WHEN btrim(lower(v_raw_role)) IN ('tenant')             THEN 'tenant'
    WHEN v_raw_role IN ('مستأجر', 'مستاجر')                 THEN 'tenant'
    WHEN btrim(lower(v_raw_role)) IN ('landlord', 'owner') THEN 'landlord'
    WHEN v_raw_role IN ('مؤجر', 'موجر', 'صاحب عقار')       THEN 'landlord'
    WHEN btrim(lower(v_raw_role)) IN ('admin')              THEN 'admin'
    WHEN v_raw_role IN ('مشرف', 'مدير')                     THEN 'admin'
    ELSE 'tenant'
  END;

  BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, phone, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'phone',
      v_role
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name  = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      phone      = EXCLUDED.phone,
      role       = EXCLUDED.role;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────

-- 5.2 تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────

-- 5.3 زيادة عداد المشاهدات (Atomic)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND (role = 'admin' OR is_admin = TRUE)
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.storage_path_from_bucket_url(p_value TEXT, p_bucket TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_value IS NULL OR btrim(p_value) = '' THEN
    RETURN p_value;
  END IF;

  IF p_value ~ ('/storage/v1/object/(public|sign)/' || p_bucket || '/') THEN
    RETURN regexp_replace(
      split_part(p_value, '?', 1),
      '^.*/storage/v1/object/(public|sign)/' || p_bucket || '/',
      ''
    );
  END IF;

  RETURN p_value;
END;
$$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_period daterange
  GENERATED ALWAYS AS (daterange(start_date, end_date, '[)')) STORED;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_overlapping_confirmed_periods;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_overlapping_confirmed_periods
  EXCLUDE USING gist (
    property_id WITH =,
    booking_period WITH &&
  )
  WHERE (status IN ('confirmed', 'active'));

UPDATE public.properties p
SET images = COALESCE((
  SELECT array_agg(public.storage_path_from_bucket_url(item.image, 'properties-images') ORDER BY item.ord)
  FROM unnest(COALESCE(p.images, '{}'::TEXT[])) WITH ORDINALITY AS item(image, ord)
), '{}'::TEXT[])
WHERE EXISTS (
  SELECT 1
  FROM unnest(COALESCE(p.images, '{}'::TEXT[])) AS item(image)
  WHERE item.image ~ '/storage/v1/object/(public|sign)/properties-images/'
);

UPDATE public.bookings
SET payment_proof = public.storage_path_from_bucket_url(payment_proof, 'payment-receipts')
WHERE payment_proof ~ '/storage/v1/object/(public|sign)/payment-receipts/';

UPDATE public.payment_requests
SET receipt_image = public.storage_path_from_bucket_url(receipt_image, 'payment-receipts')
WHERE receipt_image ~ '/storage/v1/object/(public|sign)/payment-receipts/';

UPDATE public.messages
SET media_url = CASE
  WHEN media_url ~ '/storage/v1/object/(public|sign)/chat-images/' THEN
    public.storage_path_from_bucket_url(media_url, 'chat-images')
  WHEN media_url ~ '/storage/v1/object/(public|sign)/voice-notes/' THEN
    public.storage_path_from_bucket_url(media_url, 'voice-notes')
  ELSE media_url
END
WHERE media_url ~ '/storage/v1/object/(public|sign)/(chat-images|voice-notes)/';

CREATE OR REPLACE FUNCTION public.increment_views(property_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
  SET views_count = views_count + 1
  WHERE id = property_id;
END;
$$;

-- ─────────────────────────────────────────────────────────

-- 5.4 إحصائيات لوحة تحكم المؤجر
CREATE OR REPLACE FUNCTION public.get_landlord_stats(target_user_id UUID)
RETURNS TABLE (
  total_properties BIGINT,
  active_bookings  BIGINT,
  total_earnings   DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.properties WHERE owner_id = target_user_id),
    (SELECT COUNT(*)
     FROM public.bookings b
     JOIN public.properties p ON b.property_id = p.id
     WHERE p.owner_id = target_user_id
       AND b.status IN ('confirmed', 'active')),
    (SELECT COALESCE(SUM(total_amount), 0)
     FROM public.bookings b
     JOIN public.properties p ON b.property_id = p.id
     WHERE p.owner_id = target_user_id
       AND b.status = 'completed');
END;
$$;

-- ─────────────────────────────────────────────────────────

-- 5.5 فتح العقار بعد التحقق من الدفع (عملية أتمتة آمنة)
CREATE OR REPLACE FUNCTION public.unlock_property_with_payment(
  p_user_id UUID,
  p_property_id UUID,
  p_payment_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.payment_requests
  SET is_consumed = TRUE,
      processed_at = NOW()
  WHERE id = p_payment_id
    AND user_id = p_user_id
    AND property_id = p_property_id
    AND status = 'approved'
    AND is_consumed = FALSE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found, already consumed, or not approved';
  END IF;

  INSERT INTO public.unlocked_properties (user_id, property_id)
  VALUES (p_user_id, p_property_id)
  ON CONFLICT (user_id, property_id) DO NOTHING;
END;
$$;

-- ─────────────────────────────────────────────────────────

-- 5.6 تسجيل سجل حالة العقار عند التغيير
CREATE OR REPLACE FUNCTION public.log_property_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.property_status_history (property_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_property_status_change ON public.properties;
CREATE TRIGGER trg_log_property_status_change
  AFTER UPDATE OF status ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.log_property_status_change();

-- ─────────────────────────────────────────────────────────

-- 5.7 إرسال إشعار لكل الأدمنز
CREATE OR REPLACE FUNCTION public.notify_admins(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT id, p_title, p_message, p_type, p_link
  FROM public.profiles
  WHERE is_admin = TRUE;
END;
$$;

-- ─────────────────────────────────────────────────────────

-- 5.8 الحصول على فترات الحجز المتاحة (للعرض العام)
CREATE OR REPLACE FUNCTION public.get_public_property_booking_periods(p_property_id UUID)
RETURNS TABLE(start_date DATE, end_date DATE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT b.start_date, b.end_date
  FROM public.bookings b
  WHERE b.property_id = p_property_id
    AND b.status IN ('confirmed', 'active')
    AND b.end_date > CURRENT_DATE
  ORDER BY b.start_date ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_property_booking_periods(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_property_booking_periods(UUID) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────

-- 5.9 إنشاء حجز ذري مع التحقق من التعارض
CREATE OR REPLACE FUNCTION public.create_atomic_booking(
  p_property_id UUID,
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_tenant_name TEXT,
  p_tenant_phone TEXT,
  p_base_price DECIMAL,
  p_service_fee DECIMAL,
  p_total_amount DECIMAL,
  p_total_nights INTEGER DEFAULT NULL,
  p_total_months INTEGER DEFAULT NULL,
  p_rental_type TEXT DEFAULT 'daily',
  p_tenant_email TEXT DEFAULT NULL,
  p_deposit_amount DECIMAL DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'cash_on_delivery',
  p_payment_status TEXT DEFAULT 'pending',
  p_payment_proof TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized booking actor' USING ERRCODE = '42501';
  END IF;

  IF p_start_date >= p_end_date THEN
    RAISE EXCEPTION 'Start date must be before end date';
  END IF;

  INSERT INTO public.bookings (
    property_id,
    user_id,
    start_date,
    end_date,
    total_nights,
    total_months,
    rental_type,
    tenant_name,
    tenant_phone,
    tenant_email,
    base_price,
    service_fee,
    deposit_amount,
    total_amount,
    payment_method,
    payment_status,
    payment_proof,
    status,
    created_at
  ) VALUES (
    p_property_id,
    p_user_id,
    p_start_date,
    p_end_date,
    p_total_nights,
    p_total_months,
    p_rental_type,
    p_tenant_name,
    p_tenant_phone,
    p_tenant_email,
    p_base_price,
    p_service_fee,
    p_deposit_amount,
    p_total_amount,
    p_payment_method,
    'pending',
    NULL,
    'pending',
    NOW()
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'Booking dates conflict with an existing confirmed booking'
      USING ERRCODE = '23P01';
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_booking_status(
  p_booking_id UUID,
  p_action TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_property_owner UUID;
  v_next_status TEXT;
BEGIN
  SELECT b.*
  INTO v_booking
  FROM public.bookings b
  WHERE b.id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  SELECT p.owner_id
  INTO v_property_owner
  FROM public.properties p
  WHERE p.id = v_booking.property_id
  FOR SHARE;

  IF p_action NOT IN ('tenant_cancel', 'landlord_confirm', 'landlord_reject', 'admin_cancel') THEN
    RAISE EXCEPTION 'Unsupported booking action';
  END IF;

  IF v_booking.status NOT IN ('pending', 'requested') THEN
    RAISE EXCEPTION 'This booking can no longer be changed manually';
  END IF;

  CASE p_action
    WHEN 'tenant_cancel' THEN
      IF auth.uid() IS NULL OR auth.uid() <> v_booking.user_id THEN
        RAISE EXCEPTION 'Unauthorized booking cancellation' USING ERRCODE = '42501';
      END IF;
      v_next_status := 'cancelled';
    WHEN 'landlord_confirm' THEN
      IF auth.uid() IS NULL OR (auth.uid() <> v_property_owner AND NOT public.is_admin_user(auth.uid())) THEN
        RAISE EXCEPTION 'Unauthorized booking confirmation' USING ERRCODE = '42501';
      END IF;
      v_next_status := 'confirmed';
    WHEN 'landlord_reject' THEN
      IF auth.uid() IS NULL OR (auth.uid() <> v_property_owner AND NOT public.is_admin_user(auth.uid())) THEN
        RAISE EXCEPTION 'Unauthorized booking rejection' USING ERRCODE = '42501';
      END IF;
      v_next_status := 'rejected';
    WHEN 'admin_cancel' THEN
      IF auth.uid() IS NULL OR NOT public.is_admin_user(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized admin cancellation' USING ERRCODE = '42501';
      END IF;
      v_next_status := 'cancelled';
  END CASE;

  UPDATE public.bookings
  SET status = v_next_status,
      confirmed_at = CASE
        WHEN v_next_status = 'confirmed' THEN COALESCE(confirmed_at, NOW())
        ELSE confirmed_at
      END,
      updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN v_next_status;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'Booking dates conflict with an existing confirmed booking'
      USING ERRCODE = '23P01';
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_booking_payment_proof(
  p_booking_id UUID,
  p_object_path TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_user_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_object_path IS NULL OR btrim(p_object_path) = '' THEN
    RAISE EXCEPTION 'Payment proof path is required';
  END IF;

  SELECT user_id
  INTO v_booking_user_id
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized booking payment proof update' USING ERRCODE = '42501';
  END IF;

  IF split_part(p_object_path, '/', 1) <> auth.uid()::TEXT
     OR split_part(p_object_path, '/', 2) <> p_booking_id::TEXT THEN
    RAISE EXCEPTION 'Invalid booking payment proof path';
  END IF;

  UPDATE public.bookings
  SET payment_proof = p_object_path,
      updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN p_object_path;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_payment_request_and_unlock(
  p_payment_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payment_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized payment moderation' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_payment
  FROM public.payment_requests
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found';
  END IF;

  IF v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending payment requests can be approved';
  END IF;

  IF COALESCE(v_payment.is_consumed, FALSE) THEN
    RAISE EXCEPTION 'Payment request has already been consumed';
  END IF;

  IF v_payment.amount < 50 THEN
    RAISE EXCEPTION 'Payment amount is below the unlock threshold';
  END IF;

  UPDATE public.payment_requests
  SET status = 'approved',
      is_consumed = TRUE,
      processed_at = NOW()
  WHERE id = p_payment_id;

  INSERT INTO public.unlocked_properties (user_id, property_id)
  VALUES (v_payment.user_id, v_payment.property_id)
  ON CONFLICT (user_id, property_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.moderate_property_listing(
  p_property_id UUID,
  p_new_status TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized property moderation' USING ERRCODE = '42501';
  END IF;

  IF p_new_status NOT IN ('available', 'rejected') THEN
    RAISE EXCEPTION 'Unsupported property moderation status';
  END IF;

  SELECT status
  INTO v_current_status
  FROM public.properties
  WHERE id = p_property_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF v_current_status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending properties can be moderated in this flow';
  END IF;

  UPDATE public.properties
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id = p_property_id;

  RETURN p_new_status;
END;
$$;

REVOKE ALL ON FUNCTION public.create_atomic_booking(
  UUID, UUID, DATE, DATE, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL,
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_atomic_booking(
  UUID, UUID, DATE, DATE, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL,
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT
) TO authenticated;

REVOKE ALL ON FUNCTION public.transition_booking_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_booking_status(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.attach_booking_payment_proof(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_booking_payment_proof(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.approve_payment_request_and_unlock(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_payment_request_and_unlock(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.moderate_property_listing(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moderate_property_listing(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.unlock_property_with_payment(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_property_with_payment(UUID, UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "tenants_insert_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "landlords_update_property_bookings" ON public.bookings;
DROP POLICY IF EXISTS "admins_update_bookings" ON public.bookings;
DROP POLICY IF EXISTS "admins_delete_bookings" ON public.bookings;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.bookings FROM anon, authenticated;

DROP POLICY IF EXISTS "Admins can do everything on properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete any property" ON public.properties;

CREATE POLICY "Admins can view all properties"
  ON public.properties FOR SELECT
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete any property"
  ON public.properties FOR DELETE
  USING (public.is_admin_user(auth.uid()));


-- ============================================================
-- SECTION 6: Storage Bucket — properties-images
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'properties-images',
    'properties-images',
    FALSE,
    5242880,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'payment-receipts',
    'payment-receipts',
    FALSE,
    5242880,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'chat-images',
    'chat-images',
    FALSE,
    5242880,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'voice-notes',
    'voice-notes',
    FALSE,
    10485760,
    ARRAY['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can read payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Conversation participants can upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Conversation participants can read chat images" ON storage.objects;
DROP POLICY IF EXISTS "Conversation senders can delete chat images" ON storage.objects;
DROP POLICY IF EXISTS "Conversation participants can upload voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Conversation participants can read voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Conversation senders can delete voice notes" ON storage.objects;

CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'properties-images'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Authenticated users can delete property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'properties-images'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Authenticated users can read property images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'properties-images'
    AND EXISTS (
      SELECT 1
      FROM public.properties p
      WHERE name = ANY (p.images)
        AND (
          p.status IN ('available', 'rented')
          OR p.owner_id = auth.uid()
          OR public.is_admin_user(auth.uid())
        )
    )
  );

CREATE POLICY "Users can upload payment receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Authorized users can read payment receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (
      EXISTS (
        SELECT 1
        FROM public.bookings b
        JOIN public.properties p ON p.id = b.property_id
        WHERE b.payment_proof = name
          AND (
            b.user_id = auth.uid()
            OR p.owner_id = auth.uid()
            OR public.is_admin_user(auth.uid())
          )
      )
      OR EXISTS (
        SELECT 1
        FROM public.payment_requests pr
        JOIN public.properties p ON p.id = pr.property_id
        WHERE pr.receipt_image = name
          AND (
            pr.user_id = auth.uid()
            OR p.owner_id = auth.uid()
            OR public.is_admin_user(auth.uid())
          )
      )
    )
  );

CREATE POLICY "Users can delete payment receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Conversation participants can upload chat images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images'
    AND auth.uid()::TEXT = (storage.foldername(name))[2]
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id::TEXT = (storage.foldername(name))[1]
        AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "Conversation participants can read chat images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id::TEXT = (storage.foldername(name))[1]
        AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "Conversation senders can delete chat images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND auth.uid()::TEXT = (storage.foldername(name))[2]
  );

CREATE POLICY "Conversation participants can upload voice notes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voice-notes'
    AND auth.uid()::TEXT = (storage.foldername(name))[2]
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id::TEXT = (storage.foldername(name))[1]
        AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "Conversation participants can read voice notes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'voice-notes'
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id::TEXT = (storage.foldername(name))[1]
        AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "Conversation senders can delete voice notes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'voice-notes'
    AND auth.uid()::TEXT = (storage.foldername(name))[2]
  );

-- ============================================================
-- SECTION 7: Realtime
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ============================================================
-- SECTION 8: Sync Admin Flag
-- ============================================================

-- تأكد من تزامن حقل is_admin مع role = 'admin'
UPDATE public.profiles SET role = 'admin' WHERE is_admin = TRUE AND role <> 'admin';
UPDATE public.profiles SET is_admin = TRUE WHERE role = 'admin' AND is_admin IS DISTINCT FROM TRUE;


-- ============================================================
-- SECTION 9: Views
-- ============================================================

DROP VIEW IF EXISTS public.bookings_with_details;
CREATE VIEW public.bookings_with_details AS
SELECT
  b.id,
  b.property_id,
  b.user_id,
  b.start_date,
  b.end_date,
  b.status,
  b.total_amount,
  b.created_at,
  b.updated_at,
  p.title       AS property_title,
  p.address     AS property_address,
  pt.full_name  AS tenant_name,
  pt.phone      AS tenant_phone,
  po.full_name  AS owner_name,
  po.phone      AS owner_phone
FROM bookings b
LEFT JOIN properties p  ON b.property_id = p.id
LEFT JOIN profiles   pt ON b.user_id     = pt.id
LEFT JOIN profiles   po ON p.owner_id    = po.id;


-- ============================================================
-- ✅ انتهى بنجاح — MASTER_SCHEMA.sql
-- ============================================================

-- END NOTE:
-- This snapshot already includes the latest hardening state.
-- Do not run it on an existing project that already uses migrations.

NOTIFY pgrst, 'reload schema';
