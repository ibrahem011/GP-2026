-- ================================================================
-- GAMASA — functions.sql (النسخة النهائية)
-- ================================================================
-- هذا الملف يحتوي على جميع الدوال والـ Triggers فقط
-- يُستخدم عند تحديث دالة بدون إعادة تشغيل كل الـ schema
-- ================================================================

-- 1) إنشاء ملف شخصي عند التسجيل (Non-blocking)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    VALUES (NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'phone',
      v_role)
    ON CONFLICT (id) DO UPDATE SET
      full_name  = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      phone      = EXCLUDED.phone,
      role       = EXCLUDED.role;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- 3) زيادة عداد المشاهدات
CREATE OR REPLACE FUNCTION public.increment_views(property_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN UPDATE public.properties SET views_count = views_count + 1 WHERE id = property_id; END; $$;

-- 4) إحصائيات لوحة المؤجر
CREATE OR REPLACE FUNCTION public.get_landlord_stats(target_user_id UUID)
RETURNS TABLE (total_properties BIGINT, active_bookings BIGINT, total_earnings DECIMAL)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT
    (SELECT COUNT(*) FROM public.properties WHERE owner_id = target_user_id),
    (SELECT COUNT(*) FROM public.bookings b JOIN public.properties p ON b.property_id = p.id
     WHERE p.owner_id = target_user_id AND b.status IN ('confirmed', 'active')),
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings b JOIN public.properties p ON b.property_id = p.id
     WHERE p.owner_id = target_user_id AND b.status = 'completed');
END; $$;

-- 5) فتح العقار بعد التحقق من الدفع
CREATE OR REPLACE FUNCTION public.unlock_property_with_payment(
  p_user_id UUID, p_property_id UUID, p_payment_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.payment_requests SET is_consumed = TRUE, processed_at = NOW()
  WHERE id = p_payment_id AND user_id = p_user_id AND property_id = p_property_id
    AND status = 'approved' AND is_consumed = FALSE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found, already consumed, or not approved'; END IF;
  INSERT INTO public.unlocked_properties (user_id, property_id) VALUES (p_user_id, p_property_id)
  ON CONFLICT (user_id, property_id) DO NOTHING;
END; $$;

-- 6) تسجيل تغيير حالة العقار
CREATE OR REPLACE FUNCTION public.log_property_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.property_status_history (property_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_log_property_status_change ON public.properties;
CREATE TRIGGER trg_log_property_status_change
  AFTER UPDATE OF status ON public.properties FOR EACH ROW EXECUTE FUNCTION public.log_property_status_change();

-- 7) إرسال إشعار للأدمنز
CREATE OR REPLACE FUNCTION public.notify_admins(p_title TEXT, p_message TEXT, p_type TEXT, p_link TEXT DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT id, p_title, p_message, p_type, p_link FROM public.profiles WHERE is_admin = TRUE;
END; $$;

-- 8) فترات الحجز للعرض العام
CREATE OR REPLACE FUNCTION public.get_public_property_booking_periods(p_property_id UUID)
RETURNS TABLE(start_date DATE, end_date DATE)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY SELECT b.start_date, b.end_date FROM public.bookings b
  WHERE b.property_id = p_property_id
    AND b.status IN ('confirmed', 'active')
    AND b.end_date > CURRENT_DATE
  ORDER BY b.start_date ASC LIMIT 1;
END; $$;
REVOKE ALL ON FUNCTION public.get_public_property_booking_periods(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_property_booking_periods(UUID) TO anon, authenticated;

-- 9) إنشاء حجز ذري
CREATE OR REPLACE FUNCTION public.create_atomic_booking(
  p_property_id UUID, p_user_id UUID, p_start_date DATE, p_end_date DATE,
  p_tenant_name TEXT, p_tenant_phone TEXT, p_base_price DECIMAL,
  p_service_fee DECIMAL, p_total_amount DECIMAL,
  p_total_nights INTEGER DEFAULT NULL, p_total_months INTEGER DEFAULT NULL,
  p_rental_type TEXT DEFAULT 'daily', p_tenant_email TEXT DEFAULT NULL,
  p_deposit_amount DECIMAL DEFAULT NULL, p_payment_method TEXT DEFAULT 'cash_on_delivery',
  p_payment_status TEXT DEFAULT 'pending', p_payment_proof TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_booking_id UUID; v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count FROM public.bookings
  WHERE property_id = p_property_id AND status IN ('confirmed', 'active')
    AND end_date > p_start_date
    AND start_date < p_end_date
  FOR UPDATE;
  IF v_conflict_count > 0 THEN RAISE EXCEPTION 'Booking dates conflict with existing booking'; END IF;
  INSERT INTO public.bookings (property_id, user_id, start_date, end_date,
    total_nights, total_months, rental_type, tenant_name, tenant_phone, tenant_email,
    base_price, service_fee, deposit_amount, total_amount, payment_method, payment_status,
    payment_proof, status, created_at)
  VALUES (p_property_id, p_user_id, p_start_date, p_end_date,
    p_total_nights, p_total_months, p_rental_type, p_tenant_name, p_tenant_phone, p_tenant_email,
    p_base_price, p_service_fee, p_deposit_amount, p_total_amount, p_payment_method, p_payment_status,
    p_payment_proof, 'pending', NOW()) RETURNING id INTO v_booking_id;
  RETURN v_booking_id;
END; $$;
