-- ================================================================
-- GAMASA PROPERTIES - MANUAL FUNCTIONS SNAPSHOT
-- ================================================================
-- Use this file only for function/trigger hotfixes.
-- Do not use it for schema, RLS, storage buckets, or policies.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_role TEXT;
  v_role TEXT;
BEGIN
  v_raw_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  v_role := CASE
    WHEN btrim(lower(v_raw_role)) IN ('tenant') THEN 'tenant'
    WHEN v_raw_role IN ('مستأجر', 'مستاجر') THEN 'tenant'
    WHEN btrim(lower(v_raw_role)) IN ('landlord', 'owner') THEN 'landlord'
    WHEN v_raw_role IN ('مؤجر', 'موجر', 'صاحب عقار') THEN 'landlord'
    WHEN btrim(lower(v_raw_role)) IN ('admin') THEN 'admin'
    WHEN v_raw_role IN ('مشرف', 'مدير') THEN 'admin'
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
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role;
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.get_landlord_stats(target_user_id UUID)
RETURNS TABLE (total_properties BIGINT, active_bookings BIGINT, total_earnings DECIMAL)
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

REVOKE ALL ON FUNCTION public.create_atomic_booking(
  UUID, UUID, DATE, DATE, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL,
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_atomic_booking(
  UUID, UUID, DATE, DATE, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL,
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT
) TO authenticated;

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

REVOKE ALL ON FUNCTION public.transition_booking_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_booking_status(UUID, TEXT) TO authenticated;

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

REVOKE ALL ON FUNCTION public.attach_booking_payment_proof(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_booking_payment_proof(UUID, TEXT) TO authenticated;

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

REVOKE ALL ON FUNCTION public.approve_payment_request_and_unlock(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_payment_request_and_unlock(UUID) TO authenticated;

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

REVOKE ALL ON FUNCTION public.moderate_property_listing(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moderate_property_listing(UUID, TEXT) TO authenticated;
