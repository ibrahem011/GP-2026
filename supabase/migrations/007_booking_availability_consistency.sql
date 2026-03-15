-- Migration 007: Booking availability consistency
-- Align App and SQL overlap checks to half-open intervals and blocking statuses.

CREATE OR REPLACE FUNCTION public.get_public_property_booking_periods(p_property_id UUID)
RETURNS TABLE(start_date DATE, end_date DATE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT b.start_date, b.end_date
  FROM public.bookings b
  WHERE b.property_id = p_property_id
    AND b.status IN ('confirmed', 'active')
    AND b.end_date > CURRENT_DATE
  ORDER BY b.start_date ASC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_atomic_booking(
  p_property_id   UUID,
  p_user_id       UUID,
  p_start_date    DATE,
  p_end_date      DATE,
  p_tenant_name   TEXT,
  p_tenant_phone  TEXT,
  p_base_price    DECIMAL,
  p_service_fee   DECIMAL,
  p_total_amount  DECIMAL,
  p_total_nights  INTEGER  DEFAULT NULL,
  p_total_months  INTEGER  DEFAULT NULL,
  p_rental_type   TEXT     DEFAULT 'daily',
  p_tenant_email  TEXT     DEFAULT NULL,
  p_deposit_amount DECIMAL DEFAULT NULL,
  p_payment_method TEXT    DEFAULT 'cash_on_delivery',
  p_payment_status TEXT    DEFAULT 'pending',
  p_payment_proof  TEXT    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_booking_id UUID;
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.bookings
  WHERE property_id = p_property_id
    AND status IN ('confirmed', 'active')
    AND end_date > p_start_date
    AND start_date < p_end_date
  FOR UPDATE;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Booking dates conflict with existing booking';
  END IF;

  INSERT INTO public.bookings (
    property_id, user_id, start_date, end_date,
    total_nights, total_months, rental_type,
    tenant_name, tenant_phone, tenant_email,
    base_price, service_fee, deposit_amount, total_amount,
    payment_method, payment_status, payment_proof,
    status, created_at
  ) VALUES (
    p_property_id, p_user_id, p_start_date, p_end_date,
    p_total_nights, p_total_months, p_rental_type,
    p_tenant_name, p_tenant_phone, p_tenant_email,
    p_base_price, p_service_fee, p_deposit_amount, p_total_amount,
    p_payment_method, p_payment_status, p_payment_proof,
    'pending', NOW()
  ) RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;
