
-- ================================================================
-- GAMASA PROPERTIES - EXISTING PROJECT UPGRADE BUNDLE
-- Purpose: apply missing changes that are NOT reflected in manual/MASTER_SCHEMA.sql.
-- Safe target: projects already at manual/MASTER_SCHEMA.sql state or up to migration 008.
-- Includes: 006_user_data_fetch.sql + fixed 009_admin_system_expansion.sql + 010_booking_landlord_notes.sql
-- ================================================================

-- ================================================================
-- Migration 006: User Data Fetch RPCs
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_user_bookings(uid uuid)
RETURNS TABLE (
  booking_id uuid,
  booking_property_id uuid,
  booking_user_id uuid,
  start_date date,
  end_date date,
  total_amount numeric,
  status text,
  created_at timestamptz,
  tenant_name text,
  booking_type text,
  prop_id uuid,
  prop_title text,
  prop_images text[],
  prop_area text,
  prop_owner_id uuid,
  prop_owner_name text,
  prop_owner_phone text,
  profile_id uuid,
  profile_full_name text,
  profile_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> uid THEN
    RAISE EXCEPTION 'Unauthorized access' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH tenant_bookings AS (
    SELECT
      b.id AS booking_id,
      b.property_id AS booking_property_id,
      b.user_id AS booking_user_id,
      b.start_date,
      b.end_date,
      b.total_amount,
      b.status,
      b.created_at,
      b.tenant_name,
      'tenant'::text AS booking_type,
      p.id AS prop_id,
      p.title AS prop_title,
      p.images AS prop_images,
      p.area AS prop_area,
      p.owner_id AS prop_owner_id,
      p.owner_name AS prop_owner_name,
      p.owner_phone AS prop_owner_phone,
      NULL::uuid AS profile_id,
      NULL::text AS profile_full_name,
      NULL::text AS profile_avatar_url
    FROM public.bookings b
    LEFT JOIN public.properties p ON b.property_id = p.id
    WHERE b.user_id = uid
  ),
  landlord_bookings AS (
    SELECT
      b.id AS booking_id,
      b.property_id AS booking_property_id,
      b.user_id AS booking_user_id,
      b.start_date,
      b.end_date,
      b.total_amount,
      b.status,
      b.created_at,
      b.tenant_name,
      'owner'::text AS booking_type,
      p.id AS prop_id,
      p.title AS prop_title,
      p.images AS prop_images,
      p.area AS prop_area,
      p.owner_id AS prop_owner_id,
      p.owner_name AS prop_owner_name,
      p.owner_phone AS prop_owner_phone,
      u.id AS profile_id,
      u.full_name AS profile_full_name,
      u.avatar_url AS profile_avatar_url
    FROM public.bookings b
    LEFT JOIN public.properties p ON b.property_id = p.id
    LEFT JOIN public.profiles u ON b.user_id = u.id
    WHERE p.owner_id = uid
  )
  SELECT * FROM tenant_bookings
  UNION ALL
  SELECT * FROM landlord_bookings
  ORDER BY created_at DESC
  LIMIT 200;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_favorites(uid uuid)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  title text,
  description text,
  price numeric,
  price_unit text,
  category text,
  status text,
  images text[],
  location_lat double precision,
  location_lng double precision,
  address text,
  area text,
  bedrooms integer,
  bathrooms integer,
  floor_area integer,
  floor_number integer,
  features text[],
  owner_phone text,
  owner_name text,
  is_verified boolean,
  views_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> uid THEN
    RAISE EXCEPTION 'Unauthorized access' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.owner_id,
    p.title,
    p.description,
    p.price,
    p.price_unit,
    p.category,
    p.status,
    p.images,
    p.location_lat,
    p.location_lng,
    p.address,
    p.area,
    p.bedrooms,
    p.bathrooms,
    p.floor_area,
    p.floor_number,
    p.features,
    p.owner_phone,
    p.owner_name,
    p.is_verified,
    p.views_count,
    p.created_at,
    p.updated_at
  FROM public.favorites f
  INNER JOIN public.properties p ON f.property_id = p.id
  WHERE f.user_id = uid
  ORDER BY f.created_at DESC
  LIMIT 100;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_bookings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_bookings(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_favorites(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_favorites(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';


-- ================================================================
-- Migration 009 (fixed/idempotent): Admin system expansion
-- Source: migrations/009_admin_system_expansion.sql
-- Notes:
-- - Added DROP POLICY IF EXISTS before CREATE POLICY.
-- - Guarded national_id data migration so reruns do not fail after the column is dropped.
-- - Added SET search_path = public and explicit EXECUTE grants for the SECURITY DEFINER function.
-- ================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_reason TEXT;

CREATE TABLE IF NOT EXISTS public.user_secrets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  national_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own secrets" ON public.user_secrets;
CREATE POLICY "Users can read own secrets"
  ON public.user_secrets FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = TRUE)
    )
  );

DROP POLICY IF EXISTS "Users can update own secrets" ON public.user_secrets;
CREATE POLICY "Users can update own secrets"
  ON public.user_secrets FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own secrets" ON public.user_secrets;
CREATE POLICY "Users can insert own secrets"
  ON public.user_secrets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage secrets" ON public.user_secrets;
CREATE POLICY "Admins can manage secrets"
  ON public.user_secrets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = TRUE)
    )
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'national_id'
  ) THEN
    INSERT INTO public.user_secrets (user_id, national_id)
    SELECT id, national_id
    FROM public.profiles
    WHERE national_id IS NOT NULL
    ON CONFLICT (user_id) DO UPDATE
    SET national_id = COALESCE(public.user_secrets.national_id, EXCLUDED.national_id);

    ALTER TABLE public.profiles DROP COLUMN IF EXISTS national_id;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for settings" ON public.system_settings;
CREATE POLICY "Public read for settings"
  ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings"
  ON public.system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = TRUE)
    )
  );

INSERT INTO public.system_settings (key, value, description)
VALUES
  ('commissions', '{"service_fee_percentage": 10, "fixed_fee": 50}', 'نسب وعمولات المنصة الافتراضية'),
  ('general', '{"maintenance_mode": false, "contact_phone": ""}', 'إعدادات المنصة العامة')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_transition_booking_status(
  p_booking_id UUID,
  p_new_status TEXT,
  p_reject_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR is_admin = TRUE)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can perform this action';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  UPDATE public.bookings
  SET status = p_new_status,
      updated_at = NOW(),
      confirmed_at = CASE
        WHEN p_new_status = 'confirmed' THEN NOW()
        ELSE confirmed_at
      END
  WHERE id = p_booking_id;

  INSERT INTO public.admin_audit_logs (action, actor_user_id, target_type, target_id, metadata)
  VALUES (
    'update_booking_status',
    auth.uid(),
    'booking',
    p_booking_id::TEXT,
    jsonb_build_object('old', v_booking.status, 'new', p_new_status, 'reason', p_reject_reason)
  );

  RETURN p_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_transition_booking_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_transition_booking_status(UUID, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';


-- Migration 010: Booking landlord notes + unified booking response RPC

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS landlord_note TEXT,
  ADD COLUMN IF NOT EXISTS landlord_note_updated_at TIMESTAMPTZ;

DROP FUNCTION IF EXISTS public.transition_booking_status(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.transition_booking_status(
  p_booking_id UUID,
  p_action TEXT,
  p_landlord_note TEXT DEFAULT NULL
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
  v_landlord_note TEXT;
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

  v_landlord_note := NULLIF(btrim(COALESCE(p_landlord_note, '')), '');

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
      landlord_note = CASE
        WHEN p_action IN ('landlord_confirm', 'landlord_reject') THEN v_landlord_note
        ELSE landlord_note
      END,
      landlord_note_updated_at = CASE
        WHEN p_action IN ('landlord_confirm', 'landlord_reject') AND v_landlord_note IS NOT NULL THEN NOW()
        WHEN p_action IN ('landlord_confirm', 'landlord_reject') THEN NULL
        ELSE landlord_note_updated_at
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

REVOKE ALL ON FUNCTION public.transition_booking_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_booking_status(UUID, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
