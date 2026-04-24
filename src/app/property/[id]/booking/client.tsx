'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getCurrentUser, setCurrentUser } from '@/lib/storage';
import { PropertyRow, getIsMockMode, supabaseService } from '@/services/supabaseService';
import { RentalConfig, RentalType } from '@/types';
import { validateUUID } from '@/utils/validation';
import DateSelector from '@/components/booking/DateSelector';
import TenantForm from '@/components/booking/TenantForm';
import PaymentMethods from '@/components/booking/PaymentMethods';
import PriceBreakdown from '@/components/booking/PriceBreakdown';

interface BookingPageClientProps {
  propertyId: string;
  initialProperty: PropertyRow;
}

type BookingStep = 1 | 2 | 3 | 4;
type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';
type PaymentMethod = 'vodafone_cash' | 'instapay' | 'cash_on_delivery';
type PropertyAccessState = 'checking' | 'allowed' | 'denied';

type BookingErrors = {
  startDate?: string;
  endDate?: string;
  availability?: string;
  tenantName?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  paymentMethod?: string;
  userId?: string;
  submit?: string;
};

const PHONE_REGEX = /^01\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEPS: { id: BookingStep; label: string }[] = [
  { id: 1, label: 'التواريخ' },
  { id: 2, label: 'بيانات المستأجر' },
  { id: 3, label: 'الدفع' },
  { id: 4, label: 'المراجعة' },
];

const parseDateOnly = (date: string) => (date ? new Date(`${date}T00:00:00.000Z`) : null);

const createUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const paymentLabel = (method: PaymentMethod | null) => {
  if (method === 'vodafone_cash') return 'فودافون كاش';
  if (method === 'instapay') return 'إنستاباي';
  if (method === 'cash_on_delivery') return 'الدفع عند الاستلام';
  return 'غير محدد';
};

export default function BookingPageClient({ propertyId, initialProperty }: BookingPageClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('idle');
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const [priceDetails, setPriceDetails] = useState({ basePrice: 0, serviceFee: 0, depositAmount: 0, totalAmount: 0, duration: 0 });
  const [resolvedUserId, setResolvedUserId] = useState('');
  const [errors, setErrors] = useState<BookingErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [propertyAccess, setPropertyAccess] = useState<PropertyAccessState>('checking');

  const rentalConfig = useMemo<RentalConfig>(() => {
    const type: RentalType = initialProperty.price_unit === 'month' ? 'monthly' : 'daily';
    return { type, pricePerUnit: Number(initialProperty.price || 0), minDuration: 1, maxDuration: type === 'monthly' ? 24 : 60 };
  }, [initialProperty.price, initialProperty.price_unit]);

  const isUserIdValid = validateUUID(resolvedUserId);

  const focusMap: Record<keyof BookingErrors, string> = {
    startDate: 'booking-start-date',
    endDate: 'booking-end-date',
    availability: 'availability-status',
    tenantName: 'tenant-name',
    tenantPhone: 'tenant-phone',
    tenantEmail: 'tenant-email',
    paymentMethod: 'payment-method-vodafone_cash',
    userId: 'booking-error-banner',
    submit: 'booking-error-banner',
  };

  const focusError = (key: keyof BookingErrors) => {
    window.requestAnimationFrame(() => {
      const el = document.getElementById(focusMap[key]);
      if (!el) {
        errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement || el instanceof HTMLSelectElement) el.focus();
    });
  };

  const applyErrors = (nextErrors: BookingErrors, order: (keyof BookingErrors)[]) => {
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    const first = order.find((key) => nextErrors[key]);
    if (first) focusError(first);
  };

  const validateStep1 = () => {
    const next: BookingErrors = {};
    if (!startDate) next.startDate = 'يرجى اختيار تاريخ الوصول.';
    if (!endDate) next.endDate = 'يرجى اختيار تاريخ المغادرة.';
    if (startDate && endDate && startDate >= endDate) next.endDate = 'يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول.';
    if (!next.startDate && !next.endDate && availabilityStatus !== 'available') {
      if (availabilityStatus === 'checking') next.availability = 'جاري التحقق من التوافر. انتظر قليلا.';
      else if (availabilityStatus === 'unavailable') next.availability = 'العقار غير متاح. غيّر التواريخ وحاول مرة أخرى.';
      else next.availability = 'تعذر التحقق من التوافر. حاول مرة أخرى.';
    }
    return next;
  };

  const validateStep2 = () => {
    const next: BookingErrors = {};
    if (!tenantName.trim()) next.tenantName = 'يرجى إدخال الاسم الكامل.';
    if (!PHONE_REGEX.test(tenantPhone.trim())) next.tenantPhone = 'يرجى إدخال رقم مصري صحيح بصيغة 01XXXXXXXXX.';
    if (tenantEmail.trim() && !EMAIL_REGEX.test(tenantEmail.trim())) next.tenantEmail = 'يرجى إدخال بريد إلكتروني صحيح.';
    return next;
  };

  const validateStep3 = () => (!paymentMethod ? { paymentMethod: 'يرجى اختيار طريقة دفع.' } : {});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const upgradeMockId = (legacyId: string) => {
      const uuid = createUuid();
      const current = getCurrentUser();
      if (current && current.id === legacyId) setCurrentUser({ ...current, id: uuid });

      const rawUsers = window.localStorage.getItem('gamasa_users');
      if (rawUsers) {
        try {
          const users = JSON.parse(rawUsers) as Array<Record<string, unknown>>;
          window.localStorage.setItem('gamasa_users', JSON.stringify(users.map((u) => {
            const candidateId = typeof u.id === 'string' ? u.id : '';
            const candidateEmail = typeof u.email === 'string' ? u.email : '';
            if (candidateId === legacyId || (user.email && candidateEmail === user.email)) return { ...u, id: uuid };
            return u;
          })));
        } catch {
          // no-op
        }
      }
      return uuid;
    };

    const hydrate = async () => {
      let nextId = user.id;
      if (!validateUUID(nextId)) {
        if (getIsMockMode()) nextId = upgradeMockId(nextId);
        else {
          if (!cancelled) {
            setResolvedUserId('');
            setErrors((prev) => ({ ...prev, userId: 'تعذر التحقق من هوية الحساب. يرجى تسجيل الدخول مرة أخرى.' }));
          }
          return;
        }
      }

      if (cancelled) return;
      setResolvedUserId(nextId);
      setErrors((prev) => ({ ...prev, userId: undefined }));

      setTenantName((prev) => prev || user.name || user.email?.split('@')[0] || '');
      setTenantEmail((prev) => prev || user.email || '');
      if (user.phone) setTenantPhone((prev) => prev || user.phone);

      if (!user.phone && validateUUID(nextId)) {
        const profile = await supabaseService.getProfile(nextId);
        if (!cancelled && profile?.phone) setTenantPhone((prev) => prev || profile.phone || '');
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const verifyPropertyAccess = async () => {
      if (authLoading) return;

      if (!user) {
        setPropertyAccess('checking');
        return;
      }

      const state = await supabaseService.getTenantPropertyState(user.id, propertyId);
      if (cancelled) return;

      setPropertyAccess(state.unlockedAt || state.hasBookingHistory ? 'allowed' : 'denied');
    };

    void verifyPropertyAccess();

    return () => {
      cancelled = true;
    };
  }, [authLoading, propertyId, user]);

  useEffect(() => {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end || startDate >= endDate) {
      setPriceDetails({ basePrice: 0, serviceFee: 0, depositAmount: 0, totalAmount: 0, duration: 0 });
      return;
    }
    setPriceDetails(supabaseService.calculateTotalPrice(rentalConfig, start, end));
  }, [startDate, endDate, rentalConfig]);

  useEffect(() => {
    if (!startDate || !endDate || startDate >= endDate) {
      setAvailabilityStatus('idle');
      setAvailabilityMessage('');
      return;
    }

    let mounted = true;
    setAvailabilityStatus('checking');
    setAvailabilityMessage('جاري التحقق...');

    const timer = setTimeout(async () => {
      const { available, error } = await supabaseService.checkAvailability(propertyId, startDate, endDate);
      if (!mounted) return;
      if (error) {
        setAvailabilityStatus('error');
        setAvailabilityMessage(error.message || 'تعذر التحقق من التوافر.');
      } else {
        setAvailabilityStatus(available ? 'available' : 'unavailable');
        setAvailabilityMessage(available ? 'متاح' : 'غير متاح');
      }
    }, 350);

    return () => { mounted = false; clearTimeout(timer); };
  }, [propertyId, startDate, endDate]);

  const nextDisabled = useMemo(() => {
    if (!isUserIdValid || isSubmitting) return true;
    if (currentStep === 1) return !startDate || !endDate || startDate >= endDate || availabilityStatus === 'checking' || availabilityStatus !== 'available';
    if (currentStep === 2) return !tenantName.trim() || !PHONE_REGEX.test(tenantPhone.trim()) || (!!tenantEmail.trim() && !EMAIL_REGEX.test(tenantEmail.trim()));
    if (currentStep === 3) return !paymentMethod;
    return false;
  }, [availabilityStatus, currentStep, endDate, isSubmitting, isUserIdValid, paymentMethod, startDate, tenantEmail, tenantName, tenantPhone]);

  const handleNext = () => {
    if (!isUserIdValid) {
      applyErrors({ userId: 'تعذر التحقق من هوية الحساب. يرجى تسجيل الدخول مرة أخرى.' }, ['userId']);
      return;
    }

    const validation: BookingErrors = currentStep === 1 ? validateStep1() : currentStep === 2 ? validateStep2() : validateStep3();
    const hasErrors = Object.keys(validation).some((k) => Boolean(validation[k as keyof BookingErrors]));
    if (hasErrors) {
      applyErrors(validation, ['startDate', 'endDate', 'availability', 'tenantName', 'tenantPhone', 'tenantEmail', 'paymentMethod']);
      return;
    }

    setErrors({});
    setCurrentStep((prev) => Math.min(4, (prev + 1) as BookingStep) as BookingStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(1, (prev - 1) as BookingStep) as BookingStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const allErrors: BookingErrors = { ...validateStep1(), ...validateStep2(), ...validateStep3() };
    if (!isUserIdValid) allErrors.userId = 'تعذر التحقق من هوية الحساب. يرجى تسجيل الدخول مرة أخرى.';

    if (Object.keys(allErrors).some((k) => Boolean(allErrors[k as keyof BookingErrors]))) {
      const nextStep: BookingStep = allErrors.startDate || allErrors.endDate || allErrors.availability ? 1 : allErrors.tenantName || allErrors.tenantPhone || allErrors.tenantEmail ? 2 : allErrors.paymentMethod ? 3 : 4;
      setCurrentStep(nextStep);
      applyErrors(allErrors, ['startDate', 'endDate', 'availability', 'tenantName', 'tenantPhone', 'tenantEmail', 'paymentMethod', 'userId']);
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, submit: undefined }));

    try {
      const { data: booking, error } = await supabaseService.createBooking({
        propertyId,
        userId: resolvedUserId,
        startDate,
        endDate,
        totalNights: rentalConfig.type === 'daily' ? priceDetails.duration : undefined,
        totalMonths: rentalConfig.type !== 'daily' ? priceDetails.duration : undefined,
        rentalType: rentalConfig.type,
        tenantName: tenantName.trim(),
        tenantPhone: tenantPhone.trim(),
        tenantEmail: tenantEmail.trim() || undefined,
        basePrice: priceDetails.basePrice,
        serviceFee: priceDetails.serviceFee,
        depositAmount: priceDetails.depositAmount,
        totalAmount: priceDetails.totalAmount,
        paymentMethod: paymentMethod!,
        paymentStatus: 'pending',
        status: 'pending',
      });

      if (error || !booking) throw new Error(error?.message || 'تعذر إنشاء الحجز.');
      router.push(`/property/${propertyId}/booking/confirmation?bookingId=${booking.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل إرسال طلب الحجز. حاول مرة أخرى.';
      applyErrors({ submit: message }, ['submit']);
      setIsSubmitting(false);
    }
  };

  const availabilityClass = availabilityStatus === 'available'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300'
    : availabilityStatus === 'unavailable'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300'
      : availabilityStatus === 'checking'
        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-300'
        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300';

  const primaryLabel = currentStep < 4 ? 'التالي' : (isSubmitting ? 'جاري التأكيد...' : 'تأكيد الحجز');
  const bookingRedirect = encodeURIComponent(`/property/${propertyId}/booking`);

  if (authLoading || (user && propertyAccess === 'checking')) {
    return <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-background-light px-4 py-8 dark:bg-background-dark">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300"><span className="material-symbols-outlined">lock</span></div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-zinc-100">يجب تسجيل الدخول أولا</h2>
          <p className="mb-6 text-sm text-gray-600 dark:text-zinc-300">لإتمام الحجز ومتابعة الطلب، سجّل الدخول ثم ارجع تلقائيا لهذه الصفحة.</p>
          <Link href={`/auth?mode=login&redirect=${bookingRedirect}`} className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">تسجيل الدخول</Link>
          <button type="button" onClick={() => router.push(`/property/${propertyId}`)} className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">العودة للعقار</button>
        </div>
      </div>
    );
  }

  if (propertyAccess === 'denied') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-background-light px-4 py-8 dark:bg-background-dark">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
            <span className="material-symbols-outlined">lock</span>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-zinc-100">يجب فك قفل هذا العقار أولا</h2>
          <p className="mb-6 text-sm text-gray-600 dark:text-zinc-300">ادفع رسوم فك القفل لهذا العقار من صفحة التفاصيل، وبعد تفعيل الوصول سيظهر لك زر الحجز هنا.</p>
          <button
            type="button"
            onClick={() => router.push(`/property/${propertyId}`)}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            العودة للعقار
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light pb-[13rem] dark:bg-background-dark">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto max-w-6xl px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => router.back()} aria-label="الرجوع" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"><span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>
            <h1 className="text-base font-bold text-gray-900 dark:text-zinc-100">إتمام الحجز</h1>
            <span className="w-10" />
          </div>
          <div className="mt-4">
            <div className="relative h-1 rounded-full bg-gray-200 dark:bg-zinc-800"><div className="absolute right-0 top-0 h-1 rounded-full bg-blue-600 transition-all" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} /></div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs font-medium text-gray-500 dark:text-zinc-400">{STEPS.map((s) => { const done = currentStep > s.id; const active = currentStep === s.id; return <div key={s.id} className="space-y-1"><div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-[11px] ${done ? 'border-blue-600 bg-blue-600 text-white' : active ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-400 dark:border-zinc-700'}`}>{done ? <span className="material-symbols-outlined text-sm">check</span> : s.id}</div><p className={active || done ? 'text-blue-600 dark:text-blue-400' : ''}>{s.label}</p></div>; })}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12 lg:gap-8 lg:px-6">
        <section className="space-y-4 lg:col-span-7">
          {currentStep === 1 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-zinc-100">اختر التواريخ</h2>
              <DateSelector
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={(value) => { setStartDate(value); setErrors((p) => ({ ...p, startDate: undefined, endDate: undefined, availability: undefined, submit: undefined })); }}
                onEndDateChange={(value) => { setEndDate(value); setErrors((p) => ({ ...p, endDate: undefined, availability: undefined, submit: undefined })); }}
                rentalConfig={rentalConfig}
                errors={{ startDate: errors.startDate, endDate: errors.endDate }}
              />
              {(startDate && endDate) ? <div id="availability-status" className={`mt-3 rounded-xl border px-3 py-2 text-sm ${availabilityClass}`}>{availabilityStatus === 'checking' ? 'جاري التحقق...' : availabilityStatus === 'available' ? '✅ متاح' : availabilityStatus === 'unavailable' ? '❌ غير متاح' : 'تعذر التحقق من التوافر'}<p className="mt-1 text-xs opacity-90">{availabilityStatus === 'unavailable' ? 'غيّر التواريخ وحاول مرة أخرى.' : availabilityMessage}</p></div> : null}
              {errors.availability ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.availability}</p> : null}
            </div>
          ) : null}

          {currentStep === 2 ? <TenantForm tenantName={tenantName} tenantPhone={tenantPhone} tenantEmail={tenantEmail} onNameChange={(v) => { setTenantName(v); setErrors((p) => ({ ...p, tenantName: undefined, submit: undefined })); }} onPhoneChange={(v) => { setTenantPhone(v); setErrors((p) => ({ ...p, tenantPhone: undefined, submit: undefined })); }} onEmailChange={(v) => { setTenantEmail(v); setErrors((p) => ({ ...p, tenantEmail: undefined, submit: undefined })); }} errors={{ tenantName: errors.tenantName, tenantPhone: errors.tenantPhone, tenantEmail: errors.tenantEmail }} /> : null}
          {currentStep === 3 ? <PaymentMethods selectedMethod={paymentMethod} onMethodChange={(m) => { setPaymentMethod(m); setErrors((p) => ({ ...p, paymentMethod: undefined, submit: undefined })); }} error={errors.paymentMethod} /> : null}

          {currentStep === 4 ? (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-zinc-100">مراجعة الحجز</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 dark:border-zinc-800"><dt className="text-gray-500 dark:text-zinc-400">التواريخ</dt><dd className="font-semibold text-gray-900 dark:text-zinc-100">{startDate} - {endDate}</dd></div>
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 dark:border-zinc-800"><dt className="text-gray-500 dark:text-zinc-400">الاسم</dt><dd className="font-semibold text-gray-900 dark:text-zinc-100">{tenantName}</dd></div>
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 dark:border-zinc-800"><dt className="text-gray-500 dark:text-zinc-400">الهاتف</dt><dd className="font-semibold text-gray-900 dark:text-zinc-100">{tenantPhone}</dd></div>
                  {tenantEmail ? <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 dark:border-zinc-800"><dt className="text-gray-500 dark:text-zinc-400">البريد الإلكتروني</dt><dd className="font-semibold text-gray-900 dark:text-zinc-100">{tenantEmail}</dd></div> : null}
                  <div className="flex items-center justify-between gap-3"><dt className="text-gray-500 dark:text-zinc-400">طريقة الدفع</dt><dd className="font-semibold text-gray-900 dark:text-zinc-100">{paymentLabel(paymentMethod)}</dd></div>
                </dl>
              </div>
              <PriceBreakdown rentalType={rentalConfig.type} duration={priceDetails.duration} pricePerUnit={rentalConfig.pricePerUnit} basePrice={priceDetails.basePrice} serviceFee={priceDetails.serviceFee} depositAmount={priceDetails.depositAmount} totalAmount={priceDetails.totalAmount} />
            </>
          ) : null}

          {(errors.userId || errors.submit) ? <div id="booking-error-banner" ref={errorBannerRef} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">{errors.userId || errors.submit}</div> : null}

          <div className="hidden items-center justify-between border-t border-gray-200 pt-4 dark:border-zinc-800 lg:flex">
            {currentStep > 1 ? <button type="button" onClick={handlePrev} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900">السابق</button> : <span />}
            <button type="button" onClick={() => (currentStep < 4 ? handleNext() : void handleSubmit())} disabled={nextDisabled} className="inline-flex min-w-36 items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && currentStep === 4 ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : primaryLabel}</button>
          </div>
        </section>

        <aside className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:sticky lg:top-24">
            <div className="flex gap-3">
              {initialProperty.images?.[0] ? <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-gray-100 dark:bg-zinc-800"><Image src={initialProperty.images[0]} alt={initialProperty.title} fill className="object-cover" sizes="80px" /></div> : <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"><span className="material-symbols-outlined">image</span></div>}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{rentalConfig.type === 'daily' ? 'إيجار يومي' : rentalConfig.type === 'monthly' ? 'إيجار شهري' : 'إيجار موسمي'}</p>
                <h3 className="mt-1 truncate text-sm font-bold text-gray-900 dark:text-zinc-100">{initialProperty.title}</h3>
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-zinc-400">{initialProperty.address || 'جمصة'}</p>
              </div>
            </div>
            <div className="mt-4 hidden lg:block"><PriceBreakdown rentalType={rentalConfig.type} duration={priceDetails.duration} pricePerUnit={rentalConfig.pricePerUnit} basePrice={priceDetails.basePrice} serviceFee={priceDetails.serviceFee} depositAmount={priceDetails.depositAmount} totalAmount={priceDetails.totalAmount} /></div>
          </div>
        </aside>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 px-4 pb-2 pt-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}>
        {priceDetails.totalAmount > 0 ? <PriceBreakdown rentalType={rentalConfig.type} duration={priceDetails.duration} pricePerUnit={rentalConfig.pricePerUnit} basePrice={priceDetails.basePrice} serviceFee={priceDetails.serviceFee} depositAmount={priceDetails.depositAmount} totalAmount={priceDetails.totalAmount} compact className="mb-3" /> : <p className="mb-3 text-center text-xs text-gray-500 dark:text-zinc-400">اختر التواريخ لحساب السعر الإجمالي</p>}
        <div className="flex items-center gap-2">
          {currentStep > 1 ? <button type="button" onClick={handlePrev} aria-label="الخطوة السابقة" className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 text-gray-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"><span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button> : null}
          <button type="button" onClick={() => (currentStep < 4 ? handleNext() : void handleSubmit())} disabled={nextDisabled} className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && currentStep === 4 ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : primaryLabel}</button>
        </div>
      </div>
    </div>
  );
}
