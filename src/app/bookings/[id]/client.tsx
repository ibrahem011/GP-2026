'use client';

import { type ChangeEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BookingDecisionDialog from '@/components/bookings/BookingDecisionDialog';
import PriceBreakdown from '@/components/booking/PriceBreakdown';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import {
    calculateBookingDuration,
    canLandlordRespondToBooking,
    canTenantCancelBooking,
    formatPaymentMethod,
    formatPaymentStatus,
    getBookingStatusBadgeClass,
    getBookingStatusDescription,
    getBookingStatusLabel,
    getBookingUnitPrice,
} from '@/lib/bookingPresentation';
import { supabaseService } from '@/services/supabaseService';
import type { Booking } from '@/types';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';
type DecisionAction = 'landlord_confirm' | 'landlord_reject';

const PAYMENT_NUMBER = '01012345678';

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'غير متوفر';
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'بدون وقت مسجل';
const formatMoney = (value?: number) => new Intl.NumberFormat('ar-EG').format(value || 0);

function buildTimeline(booking: Booking) {
    const entries: Array<{
        key: string;
        icon: string;
        title: string;
        description: string;
        date?: string;
    }> = [{ key: 'created', icon: 'event_note', title: 'تم إنشاء الطلب', description: 'تم إرسال الحجز للمراجعة.', date: booking.createdAt }];
    if (booking.paymentProof) entries.push({ key: 'proof', icon: 'receipt_long', title: 'تم رفع إيصال الدفع', description: 'تمت إضافة صورة إيصال للحجز.', date: undefined });
    if (booking.landlordNote) entries.push({ key: 'note', icon: 'comment', title: 'ملاحظة من المؤجر', description: booking.landlordNote, date: booking.landlordNoteUpdatedAt });
    if (booking.confirmedAt) entries.push({ key: 'confirmed', icon: 'check_circle', title: 'تم تأكيد الحجز', description: 'أصبح الحجز مؤكداً.', date: booking.confirmedAt });
    if (booking.status === 'rejected') entries.push({ key: 'rejected', icon: 'cancel', title: 'تم رفض الطلب', description: 'انتهى الطلب بحالة رفض.', date: booking.landlordNoteUpdatedAt });
    if (booking.status === 'cancelled') entries.push({ key: 'cancelled', icon: 'block', title: 'تم إلغاء الحجز', description: 'تم إلغاء هذا الحجز.', date: booking.landlordNoteUpdatedAt });
    if (booking.status === 'completed') entries.push({ key: 'completed', icon: 'task_alt', title: 'اكتمل الحجز', description: 'اكتملت مدة الحجز.', date: undefined });
    return entries;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <article className="rounded-[1.8rem] border border-white/70 bg-white/95 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/95">
            <h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3>
            <div className="mt-4">{children}</div>
        </article>
    );
}

function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/[0.05]">
            <div className="text-xs font-bold text-slate-400">{label}</div>
            <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{value}</div>
        </div>
    );
}

export default function BookingDetailsClient({ bookingId, isCreatedFlow }: { bookingId: string; isCreatedFlow?: boolean }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [decisionAction, setDecisionAction] = useState<DecisionAction | null>(null);
    const [decisionLoading, setDecisionLoading] = useState(false);
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [uploadMessage, setUploadMessage] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const previewUrlRef = useRef<string | null>(null);

    const loadBooking = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabaseService.getBookingById(bookingId);
            if (fetchError || !data) {
                setError('لم نتمكن من العثور على هذا الحجز أو ليس لديك صلاحية الوصول إليه.');
                setBooking(null);
            } else {
                setBooking(data);
            }
        } catch (loadError) {
            console.error(loadError);
            setError('حدث خطأ أثناء تحميل تفاصيل الحجز.');
            setBooking(null);
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        if (!authLoading && user) void loadBooking();
        if (!authLoading && !user) setLoading(false);
    }, [authLoading, loadBooking, user]);

    useEffect(() => () => {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    }, []);

    const viewerRole = useMemo(() => {
        if (!booking || !user) return null;
        if (booking.userId === user.id) return 'tenant';
        if (booking.property?.ownerId === user.id) return 'landlord';
        return null;
    }, [booking, user]);


    const isTenantView = viewerRole === 'tenant';
    const isLandlordView = viewerRole === 'landlord';
    const isElectronicPayment = booking?.paymentMethod === 'vodafone_cash' || booking?.paymentMethod === 'instapay';
    const canUploadReceipt = Boolean(isTenantView && isElectronicPayment && booking && !booking.paymentProof);
    const canCancel = Boolean(booking && isTenantView && canTenantCancelBooking(booking.status));
    const canRespond = Boolean(booking && isLandlordView && canLandlordRespondToBooking(booking.status));
    const duration = booking ? calculateBookingDuration(booking) : 1;
    const unitPrice = booking ? getBookingUnitPrice(booking) : 0;
    const reference = booking?.id ? booking.id.slice(0, 8).toUpperCase() : '-';
    const timeline = booking ? buildTimeline(booking) : [];

    const openConversation = async () => {
        if (!booking?.property?.ownerId) return showToast('تعذر فتح المحادثة لهذا الحجز.', 'error');
        try {
            const conversationId = await supabaseService.createConversation({ propertyId: booking.propertyId, buyerId: booking.userId, ownerId: booking.property.ownerId });
            router.push(`/messages/${conversationId}`);
        } catch (conversationError) {
            console.error(conversationError);
            showToast('تعذر فتح المحادثة الآن.', 'error');
        }
    };

    const cancelBooking = async () => {
        if (!booking || !canCancel || !confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return;
        const previousStatus = booking.status;
        setBooking((prev) => prev ? { ...prev, status: 'cancelled' } : prev);
        const { error: cancelError } = await supabaseService.cancelBooking(booking.id);
        if (cancelError) {
            setBooking((prev) => prev ? { ...prev, status: previousStatus } : prev);
            return showToast('فشل إلغاء الحجز. حاول مرة أخرى.', 'error');
        }
        showToast('تم إلغاء الحجز بنجاح.', 'success');
        await loadBooking();
    };

    const submitDecision = async (note: string) => {
        if (!booking || !decisionAction) return;
        setDecisionLoading(true);
        const { error: decisionError } = await supabaseService.respondToBookingRequest(booking.id, decisionAction, note);
        if (decisionError) {
            setDecisionLoading(false);
            return showToast('تعذر تحديث حالة الحجز. حاول مرة أخرى.', 'error');
        }
        setDecisionLoading(false);
        setDecisionAction(null);
        showToast(decisionAction === 'landlord_confirm' ? 'تم قبول الحجز.' : 'تم رفض الحجز.', 'success');
        await loadBooking();
    };

    const uploadReceipt = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !booking) return;
        if (!file.type.startsWith('image/')) return showToast('يرجى اختيار صورة فقط.', 'error');
        if (file.size > 5 * 1024 * 1024) return showToast('الصورة أكبر من الحد المسموح.', 'error');
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const nextPreviewUrl = URL.createObjectURL(file);
        previewUrlRef.current = nextPreviewUrl;
        setPreviewUrl(nextPreviewUrl);
        setUploadState('uploading');
        setUploadMessage('جاري رفع الإيصال...');
        try {
            const { url, error: uploadError } = await supabaseService.uploadPaymentReceipt(booking.id, file);
            if (uploadError || !url) throw new Error(uploadError?.message || 'UPLOAD_FAILED');
            setBooking((prev) => prev ? { ...prev, paymentProof: url } : prev);
            setUploadState('done');
            setUploadMessage('تم رفع الإيصال بنجاح. سيتم مراجعته قريباً.');
            showToast('تم رفع الإيصال بنجاح.', 'success');
        } catch (uploadError) {
            console.error(uploadError);
            setUploadState('error');
            setUploadMessage('فشل رفع الإيصال. حاول مرة أخرى.');
            showToast('فشل رفع الإيصال.', 'error');
        }
    };

    const copyReference = async () => {
        try {
            await navigator.clipboard.writeText(reference);
            showToast('تم نسخ رقم المرجع.', 'success');
        } catch {
            showToast('تعذر نسخ رقم المرجع.', 'error');
        }
    };

    if (authLoading || loading) {
        return <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-black"><div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /><p className="mt-3 text-sm text-slate-500 dark:text-slate-300">جاري تحميل تفاصيل الحجز...</p></div></main>;
    }

    if (!user) {
        return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-black"><div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><h1 className="text-2xl font-black text-slate-900 dark:text-white">يجب تسجيل الدخول أولاً</h1><p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">لتتمكن من عرض تفاصيل الحجز وإدارته.</p><button type="button" onClick={() => router.push(`/auth?mode=login&redirect=${encodeURIComponent(`/bookings/${bookingId}`)}`)} className="mt-6 w-full rounded-2xl bg-primary px-4 py-3.5 font-bold text-white transition hover:bg-primary/90">تسجيل الدخول</button></div></main>;
    }

    if (error || !booking || !viewerRole) {
        return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-black"><div className="w-full max-w-md rounded-[2rem] border border-rose-200 bg-white p-7 text-center shadow-sm dark:border-rose-900/40 dark:bg-zinc-900"><h1 className="text-2xl font-black text-slate-900 dark:text-white">تعذر عرض الحجز</h1><p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">{error || 'هذا الحجز غير متاح حالياً.'}</p><button type="button" onClick={() => router.push('/bookings')} className="mt-6 w-full rounded-2xl bg-primary px-4 py-3.5 font-bold text-white transition hover:bg-primary/90">العودة إلى مركز الحجوزات</button></div></main>;
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-24 dark:bg-black">
            <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-black/80">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 lg:px-6">
                    <button type="button" onClick={() => router.push('/bookings')} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" aria-label="العودة إلى الحجوزات"><span className="material-symbols-outlined">arrow_forward</span></button>
                    <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Booking</p><h1 className="text-lg font-black text-slate-950 dark:text-white">تفاصيل الحجز</h1></div>
                    <button type="button" onClick={() => void copyReference()} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">#{reference}</button>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
                {isCreatedFlow ? <section className="mb-5 rounded-[1.8rem] border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-800 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-200"><h2 className="text-lg font-black">تم إرسال طلب الحجز بنجاح</h2><p className="mt-1 text-sm leading-7">هذه الصفحة أصبحت مركز الحجز الدائم: منها ستتابع الحالة، الفاتورة، الدفع، ورد المؤجر.</p></section> : null}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <section className="space-y-6 lg:col-span-8">
                        <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-zinc-900/95">
                            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-[220px_minmax(0,1fr)]">
                                <div className="relative h-52 overflow-hidden rounded-[1.5rem] bg-slate-100 dark:bg-zinc-800">{booking.property?.images?.[0] ? <Image src={booking.property.images[0]} alt={booking.property.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 220px" /> : <div className="flex h-full items-center justify-center text-slate-300 dark:text-zinc-600"><span className="material-symbols-outlined text-5xl">image</span></div>}</div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${getBookingStatusBadgeClass(booking.status)}`}>{getBookingStatusLabel(booking.status)}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">{viewerRole === 'tenant' ? 'عرض المستأجر' : 'عرض المؤجر'}</span></div>
                                    <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950 dark:text-white">{booking.property?.title || 'العقار غير متوفر'}</h2>
                                    <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">{getBookingStatusDescription(booking.status)}</p>
                                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"><KeyValue label="الفترة" value={`${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`} /><KeyValue label="الإجمالي" value={`${formatMoney(booking.totalAmount)} ج.م`} /><KeyValue label="طريقة الدفع" value={formatPaymentMethod(booking.paymentMethod)} /><KeyValue label="حالة الدفع" value={formatPaymentStatus(booking.paymentStatus)} /></div>
                                    <div className="mt-5 flex flex-wrap items-center gap-3"><Link href={`/property/${booking.propertyId}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-primary/30 hover:text-primary dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"><span className="material-symbols-outlined text-[18px]">home_work</span>عرض العقار</Link><button type="button" onClick={() => void openConversation()} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"><span className="material-symbols-outlined text-[18px]">chat</span>مراسلة الطرف الآخر</button></div>
                                </div>
                            </div>
                        </article>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <Section title="الفاتورة"><PriceBreakdown rentalType={booking.rentalType} duration={duration} pricePerUnit={unitPrice} basePrice={booking.basePrice} serviceFee={booking.serviceFee} depositAmount={booking.depositAmount} totalAmount={booking.totalAmount} /></Section>
                            <Section title="الدفع">
                                <div className="space-y-3 text-sm">
                                    <KeyValue label="رقم التحويل" value={`#${reference}`} />
                                    <KeyValue label="طريقة الدفع" value={formatPaymentMethod(booking.paymentMethod)} />
                                    <KeyValue label="حالة الدفع" value={formatPaymentStatus(booking.paymentStatus)} />
                                    {isElectronicPayment ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200"><p className="text-sm font-bold">الرقم المخصص للتحويل</p><div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-slate-900 dark:bg-zinc-950 dark:text-white"><span className="font-black">{PAYMENT_NUMBER}</span><span className="font-black">{formatMoney(booking.totalAmount)} ج.م</span></div></div> : <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-200">سيتم تحصيل المبلغ عند الاستلام.</div>}
                                    {booking.paymentProof ? <a href={booking.paymentProof} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:border-primary/30 hover:text-primary dark:border-zinc-700 dark:text-zinc-100"><span className="inline-flex items-center gap-2 font-bold"><span className="material-symbols-outlined text-[18px]">receipt_long</span>معاينة إيصال الدفع</span><span className="material-symbols-outlined text-[18px]">open_in_new</span></a> : null}
                                </div>
                            </Section>
                        </div>

                        {canUploadReceipt ? <Section title="رفع إيصال الدفع"><p className="text-sm leading-7 text-slate-500 dark:text-slate-300">ارفع صورة الإيصال ليتمكن المؤجر أو الإدارة من مراجعتها بسرعة.</p>{previewUrl ? <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-slate-200 dark:border-zinc-700"><div className="relative h-64 w-full bg-slate-100 dark:bg-zinc-800"><Image src={previewUrl} alt="معاينة الإيصال" fill className="object-contain" unoptimized /></div></div> : null}<div className="mt-4 flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"><input type="file" accept="image/*" onChange={uploadReceipt} disabled={uploadState === 'uploading'} className="hidden" /><span className="material-symbols-outlined text-[18px]">upload</span>{uploadState === 'uploading' ? 'جاري الرفع...' : 'اختيار صورة الإيصال'}</label>{uploadMessage ? <span className="text-sm text-slate-500 dark:text-slate-300">{uploadMessage}</span> : null}</div></Section> : null}

                        {booking.landlordNote ? <article className="rounded-[1.8rem] border border-blue-200 bg-blue-50/80 p-5 shadow-sm dark:border-blue-900/30 dark:bg-blue-950/20"><h3 className="text-lg font-black text-blue-900 dark:text-blue-100">ملاحظة المؤجر</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-blue-800 dark:text-blue-200">{booking.landlordNote}</p>{booking.landlordNoteUpdatedAt ? <p className="mt-2 text-xs font-bold text-blue-500 dark:text-blue-300">آخر تحديث: {formatDateTime(booking.landlordNoteUpdatedAt)}</p> : null}</article> : null}

                        <Section title="الخط الزمني"><div className="space-y-4">{timeline.map((entry) => <div key={entry.key} className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-200"><span className="material-symbols-outlined text-[20px]">{entry.icon}</span></div><div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/[0.05]"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold text-slate-900 dark:text-white">{entry.title}</h4><span className="text-xs font-bold text-slate-400">{formatDateTime(entry.date)}</span></div><p className="mt-1 text-sm leading-7 text-slate-500 dark:text-slate-300">{entry.description}</p></div></div>)}</div></Section>
                    </section>

                    <aside className="space-y-6 lg:col-span-4">
                        <Section title={isTenantView ? 'بيانات المؤجر' : 'بيانات المستأجر'}><div className="space-y-3 text-sm"><KeyValue label={isTenantView ? 'الاسم' : 'اسم المستأجر'} value={isTenantView ? booking.property?.ownerName || 'غير متوفر' : booking.tenantName || booking.user?.fullName || 'غير متوفر'} /><KeyValue label="الهاتف" value={isTenantView ? booking.property?.ownerPhone || 'غير متوفر' : booking.tenantPhone || booking.user?.phone || 'غير متوفر'} /><KeyValue label="البريد الإلكتروني" value={isTenantView ? 'يتم التواصل عبر الرسائل أو الهاتف' : booking.tenantEmail || booking.user?.email || 'غير متوفر'} /></div></Section>

                        <Section title={isTenantView ? 'إدارة الحجز' : 'لوحة القرار'}>
                            <div className="space-y-3">
                                <button type="button" onClick={() => void openConversation()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/10"><span className="material-symbols-outlined text-[18px]">chat</span>مراسلة الطرف الآخر</button>
                                {canCancel ? <button type="button" onClick={() => void cancelBooking()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3.5 text-sm font-bold text-white transition hover:bg-rose-600"><span className="material-symbols-outlined text-[18px]">close</span>إلغاء الحجز</button> : null}
                                {canRespond ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><button type="button" onClick={() => setDecisionAction('landlord_confirm')} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-600"><span className="material-symbols-outlined text-[18px]">check</span>قبول</button><button type="button" onClick={() => setDecisionAction('landlord_reject')} className="flex items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3.5 text-sm font-bold text-white transition hover:bg-rose-600"><span className="material-symbols-outlined text-[18px]">close</span>رفض</button></div> : null}
                                {!canCancel && !canRespond ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-500 dark:border-zinc-700 dark:bg-white/[0.05] dark:text-slate-300">هذا الحجز في حالة نهائية حالياً، ويمكنك فقط متابعة التفاصيل أو التواصل مع الطرف الآخر.</div> : null}
                            </div>
                        </Section>

                        {isLandlordView ? <Section title="ملخص العائد"><div className="space-y-3 text-sm"><KeyValue label="قيمة الإيجار الأساسية" value={`${formatMoney(booking.basePrice)} ج.م`} /><KeyValue label="رسوم المنصة" value={`${formatMoney(booking.serviceFee)} ج.م`} /><KeyValue label="إجمالي الدفع من المستأجر" value={`${formatMoney(booking.totalAmount)} ج.م`} /></div></Section> : null}
                    </aside>
                </div>
            </div>

            <BookingDecisionDialog open={Boolean(decisionAction)} action={decisionAction || 'landlord_confirm'} bookingTitle={booking.property?.title || 'الحجز'} guestName={booking.tenantName || booking.user?.fullName} initialNote={booking.landlordNote} loading={decisionLoading} onClose={() => { if (!decisionLoading) setDecisionAction(null); }} onSubmit={submitDecision} />
        </main>
    );
}
