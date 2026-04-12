-- 009_admin_system_expansion.sql

-- 1. Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_reason TEXT;

-- 2. Move sensitive data (national_id) out of the public profiles table
-- We create a secure table for sensitive identifiers to prevent public enumeration
CREATE TABLE IF NOT EXISTS public.user_secrets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  national_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;

-- Only the user themselves or an admin can read their secrets
CREATE POLICY "Users can read own secrets"
  ON public.user_secrets FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = TRUE)
    )
  );

CREATE POLICY "Users can update own secrets"
  ON public.user_secrets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own secrets"
  ON public.user_secrets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage secrets"
  ON public.user_secrets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = TRUE)
    )
  );

-- Migrate existing national_ids
INSERT INTO public.user_secrets (user_id, national_id)
SELECT id, national_id FROM public.profiles WHERE national_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Drop national_id from the public profiles table so SELECT USING(true) doesn't leak it
ALTER TABLE public.profiles DROP COLUMN IF EXISTS national_id;

-- 3. System Settings Contract Base
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (e.g. commission rates)
CREATE POLICY "Public read for settings"
  ON public.system_settings FOR SELECT USING (true);

-- Only admins update settings
CREATE POLICY "Admins can manage settings"
  ON public.system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = TRUE)
    )
  );

-- Seed initial basic settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('commissions', '{"service_fee_percentage": 10, "fixed_fee": 50}', 'نسب وعمولات المنصة الافتراضية'),
  ('general', '{"maintenance_mode": false, "contact_phone": ""}', 'إعدادات المنصة العامة')
ON CONFLICT (key) DO NOTHING;

-- 4. Supabase Booking Admin Overwrite Hook
-- Expands booking logic to correctly handle administrative actions directly on the DB.
CREATE OR REPLACE FUNCTION public.admin_transition_booking_status(
  p_booking_id UUID,
  p_new_status TEXT,
  p_reject_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- Strict Check
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR is_admin = TRUE)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can perform this action';
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Apply target status
  UPDATE public.bookings 
  SET 
    status = p_new_status,
    updated_at = NOW(),
    confirmed_at = CASE WHEN p_new_status = 'confirmed' THEN NOW() ELSE confirmed_at END
  WHERE id = p_booking_id;

  -- Add audit log
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
