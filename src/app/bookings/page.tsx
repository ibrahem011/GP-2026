'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BookingDecisionDialog from '@/components/bookings/BookingDecisionDialog';
import { useAuth } from '@/context/AuthContext';
import {
    canLandlordRespondToBooking,
    canTenantCancelBooking,
    getBookingStatusBadgeClass,
    getBookingStatusLabel,
} from '@/lib/bookingPresentation';
import { getIsMockMode, supabaseService } from '@/services/supabaseService';

type BookingTab = 'trips' | 'incoming';
type DecisionAction = 'landlord_confirm' | 'landlord_reject';

interface BookingListItem {
    id: string;
    propertyId: string;
    buyerId?: string;
    ownerId?: string;
    propertyTitle: string;
    propertyImage: string;
    location: string;
    totalAmount: number;
    startDate: string;
    endDate: string;
    status: string;
    guestName?: string;
    guestAvatar?: string;
    ownerName?: string;
}

const calculateNights = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
};

const INITIAL_MY_BOOKINGS: BookingListItem[] = [
    {
        id: 'b1',
        propertyId: '1',
        buyerId: 'mock-user-123',
        ownerId: 'owner-1',
        propertyTitle: 'شقة فاخرة تطل على البحر',
        propertyImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80',
        location: 'منطقة الفيلات',
        totalAmount: 4500,
        startDate: '2026-06-15',
        endDate: '2026-06-18',
        status: 'requested',
        ownerName: 'الحاج محمد',
    },
    {
        id: 'b2',
        propertyId: '2',
        buyerId: 'mock-user-123',
        ownerId: 'owner-2',
        propertyTitle: 'شاليه أرضي بحديقة',
        propertyImage: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=400&q=80',
        location: '15 مايو',
        totalAmount: 1600,
        startDate: '2026-05-01',
        endDate: '2026-05-03',
        status: 'confirmed',
        ownerName: 'أم كريم',
    },
];

const INITIAL_INCOMING_REQUESTS: BookingListItem[] = [
    {
        id: 'r1',
        propertyId: '3',
        buyerId: 'tenant-1',
        ownerId: 'mock-user-123',
        propertyTitle: 'استوديو اقتصادي للطلاب',
        propertyImage: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=400&q=80',
        location: 'حي الشباب',
        totalAmount: 3000,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        status: 'requested',
        guestName: 'أحمد علي',
        guestAvatar: '',
    },
];

function EmptyState({ icon, text }: { icon: string; text: string }) {
    return (
        <div className="py-16 text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-slate-300 dark:text-slate-600">{icon}</span>
            <p className="text-slate-500 dark:text-slate-300">{text}</p>
        </div>
    );
}

function BookingCard({
    booking,
    audience,
    onOpenConversation,
    onCancel,
    onDecision,
}: {
    booking: BookingListItem;
    audience: 'tenant' | 'landlord';
    onOpenConversation: (booking: BookingListItem) => void;
    onCancel: (booking: BookingListItem) => void;
    onDecision: (booking: BookingListItem, action: DecisionAction) => void;
}) {
    const canCancel = audience === 'tenant' && canTenantCancelBooking(booking.status);
    const canRespond = audience === 'landlord' && canLandlordRespondToBooking(booking.status);

    return (
        <article className="rounded-[1.8rem] border border-slate-200/70 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-zinc-900/95">
            <div className="flex gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.25rem] bg-slate-100 dark:bg-zinc-800">
                    {booking.propertyImage ? (
                        <img src={booking.propertyImage} className="h-full w-full object-cover" alt={booking.propertyTitle} />
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600">
                            <span className="material-symbols-outlined text-3xl">image</span>
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="truncate text-base font-black text-slate-900 dark:text-white">{booking.propertyTitle}</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                                {audience === 'tenant' ? `المؤجر: ${booking.ownerName || 'غير متوفر'}` : `الضيف: ${booking.guestName || 'غير متوفر'}`}
                            </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${getBookingStatusBadgeClass(booking.status)}`}>
                            {getBookingStatusLabel(booking.status)}
                        </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-300 sm:grid-cols-3">
                        <span className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/[0.05]">{booking.location}</span>
                        <span className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/[0.05]">{calculateNights(booking.startDate, booking.endDate)} ليالٍ</span>
                        <span className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/[0.05]">{booking.totalAmount.toLocaleString('ar-EG')} ج.م</span>
                    </div>

                    <div className="mt-3 text-xs font-bold text-slate-400">
                        {new Date(booking.startDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} - {new Date(booking.endDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-200/70 pt-4 dark:border-white/10">
                <Link
                    href={`/bookings/${booking.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
                >
                    <span className="material-symbols-outlined text-[18px]">article</span>
                    عرض التفاصيل
                </Link>

                <button
                    type="button"
                    onClick={() => onOpenConversation(booking)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/10"
                >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    مراسلة
                </button>

                {canCancel ? (
                    <button
                        type="button"
                        onClick={() => onCancel(booking)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                        إلغاء
                    </button>
                ) : null}

                {canRespond ? (
                    <>
                        <button
                            type="button"
                            onClick={() => onDecision(booking, 'landlord_confirm')}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
                        >
                            <span className="material-symbols-outlined text-[18px]">check</span>
                            قبول
                        </button>
                        <button
                            type="button"
                            onClick={() => onDecision(booking, 'landlord_reject')}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-600"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                            رفض
                        </button>
                    </>
                ) : null}
            </div>
        </article>
    );
}

export default function BookingsPage() {
    const { user, loading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<BookingTab>('trips');
    const [myBookings, setMyBookings] = useState<BookingListItem[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<BookingListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTimeout, setIsTimeout] = useState(false);
    const [decisionTarget, setDecisionTarget] = useState<{ booking: BookingListItem; action: DecisionAction } | null>(null);
    const [decisionLoading, setDecisionLoading] = useState(false);
    const timeoutMessage = 'انتهت مهلة تحميل الحجوزات. تحقق من الاتصال ثم حاول مرة أخرى.';
    const genericErrorMessage = 'حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.';

    const canViewIncoming = Boolean(getIsMockMode() || user?.role === 'landlord' || incomingRequests.length > 0);

    const fetchData = useCallback(async () => {
        if (!user && !getIsMockMode()) return;
        setError(null);
        setIsTimeout(false);
        setLoading(true);

        try {
            if (getIsMockMode()) {
                setMyBookings(INITIAL_MY_BOOKINGS);
                setIncomingRequests(INITIAL_INCOMING_REQUESTS);
                return;
            }

            if (!user) return;

            const { bookings, error: fetchError, isTimeout: timedOut } = await supabaseService.getUserBookings(user.id, {
                timeoutMs: 15_000,
                maxRetries: 2,
            });

            if (timedOut) {
                setIsTimeout(true);
                setError(timeoutMessage);
                return;
            }

            if (fetchError) {
                setError(genericErrorMessage);
                return;
            }

            setMyBookings(
                bookings
                    .filter((booking: any) => booking.bookingType === 'tenant')
                    .map((booking: any) => ({
                        id: booking.id,
                        propertyId: booking.propertyId,
                        buyerId: booking.userId,
                        ownerId: booking.property?.ownerId,
                        propertyTitle: booking.property?.title || 'عقار غير معروف',
                        propertyImage: booking.property?.images?.[0] || '',
                        location: booking.property?.area || 'غير محدد',
                        totalAmount: booking.totalAmount,
                        startDate: booking.startDate,
                        endDate: booking.endDate,
                        status: booking.status,
                        ownerName: booking.property?.ownerName || 'المالك',
                    })),
            );

            setIncomingRequests(
                bookings
                    .filter((booking: any) => booking.bookingType === 'owner')
                    .map((booking: any) => ({
                        id: booking.id,
                        propertyId: booking.propertyId,
                        buyerId: booking.userId,
                        ownerId: booking.property?.ownerId,
                        propertyTitle: booking.property?.title || 'عقار غير معروف',
                        propertyImage: booking.property?.images?.[0] || '',
                        location: booking.property?.area || 'غير محدد',
                        totalAmount: booking.totalAmount,
                        startDate: booking.startDate,
                        endDate: booking.endDate,
                        status: booking.status,
                        guestName: booking.tenantName || booking.user?.fullName || 'ضيف',
                        guestAvatar: booking.user?.avatarUrl || '',
                    })),
            );
        } catch (fetchFailure) {
            console.error(fetchFailure);
            setError(genericErrorMessage);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!isAuthLoading) {
            if (!user && !getIsMockMode()) setLoading(false);
            else void fetchData();
        }
    }, [fetchData, isAuthLoading, user]);

    useEffect(() => {
        if (!canViewIncoming && activeTab === 'incoming') setActiveTab('trips');
    }, [activeTab, canViewIncoming]);

    const tripStats = useMemo(() => ({
        total: myBookings.length,
        pending: myBookings.filter((booking) => canTenantCancelBooking(booking.status)).length,
    }), [myBookings]);

    const incomingStats = useMemo(() => ({
        total: incomingRequests.length,
        pending: incomingRequests.filter((booking) => canLandlordRespondToBooking(booking.status)).length,
    }), [incomingRequests]);

    const openConversation = async (booking: BookingListItem) => {
        const buyerId = booking.buyerId || user?.id;
        const ownerId = booking.ownerId;
        if (!buyerId || !ownerId) return alert('تعذر تحديد أطراف المحادثة لهذا الحجز.');

        try {
            const conversationId = await supabaseService.createConversation({
                propertyId: booking.propertyId,
                buyerId,
                ownerId,
            });

            router.push(`/messages/${conversationId}`);
        } catch (conversationError) {
            console.error(conversationError);
            alert('تعذر فتح المحادثة الآن. حاول مرة أخرى.');
        }
    };

    const cancelBooking = async (booking: BookingListItem) => {
        if (!confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return;

        const previousStatus = booking.status;
        setMyBookings((prev) => prev.map((item) => item.id === booking.id ? { ...item, status: 'cancelled' } : item));
        const { error: cancelError } = await supabaseService.cancelBooking(booking.id);

        if (cancelError) {
            alert('فشل في عملية الإلغاء. سيتم التراجع.');
            setMyBookings((prev) => prev.map((item) => item.id === booking.id ? { ...item, status: previousStatus } : item));
            return;
        }

        await fetchData();
    };

    const submitDecision = async (note: string) => {
        if (!decisionTarget) return;
        setDecisionLoading(true);

        const { error: decisionError } = await supabaseService.respondToBookingRequest(
            decisionTarget.booking.id,
            decisionTarget.action,
            note,
        );

        if (decisionError) {
            alert('فشل تحديث حالة الحجز. حاول مرة أخرى.');
            setDecisionLoading(false);
            return;
        }

        setDecisionLoading(false);
        setDecisionTarget(null);
        await fetchData();
    };

    if (isAuthLoading || loading) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 pb-28 dark:bg-black">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="mt-4 text-slate-500 dark:text-slate-300">جاري تحميل الحجوزات...</p>
            </main>
        );
    }

    if (!user && !getIsMockMode()) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 pb-28 dark:bg-black">
                <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-lg dark:bg-zinc-900">
                    <span className="material-symbols-outlined mb-4 text-6xl text-slate-400">lock</span>
                    <h2 className="mb-2 text-xl font-black text-slate-900 dark:text-white">يرجى تسجيل الدخول</h2>
                    <p className="mb-6 text-sm leading-7 text-slate-500 dark:text-slate-300">
                        يجب عليك تسجيل الدخول لعرض مركز الحجوزات الموحد الخاص بك.
                    </p>
                    <button
                        onClick={() => router.push('/auth?mode=login&redirect=/bookings')}
                        className="w-full rounded-2xl bg-primary py-3 font-bold text-white transition-colors hover:bg-primary/90"
                    >
                        تسجيل الدخول
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pb-28 dark:bg-black">
            <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-black/80">
                <div className="mx-auto max-w-5xl px-4 py-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/')}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                            aria-label="العودة إلى الرئيسية"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl font-black text-slate-950 dark:text-white">مركز الحجوزات</h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">متابعة الرحلات والطلبات الواردة وإدارة الحالة من مكان واحد.</p>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Trips</div>
                            <div className="mt-2 flex items-end justify-between gap-3">
                                <span className="text-2xl font-black text-slate-950 dark:text-white">{tripStats.total.toLocaleString('ar-EG')}</span>
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-300">قيد المتابعة: {tripStats.pending.toLocaleString('ar-EG')}</span>
                            </div>
                        </div>

                        <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Incoming</div>
                            <div className="mt-2 flex items-end justify-between gap-3">
                                <span className="text-2xl font-black text-slate-950 dark:text-white">{incomingStats.total.toLocaleString('ar-EG')}</span>
                                <span className="text-xs font-bold text-rose-600 dark:text-rose-300">تنتظر القرار: {incomingStats.pending.toLocaleString('ar-EG')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 flex rounded-2xl bg-slate-100 p-1 dark:bg-zinc-900">
                        <button
                            onClick={() => setActiveTab('trips')}
                            className={`flex-1 rounded-[1rem] py-3 text-sm font-black transition ${activeTab === 'trips' ? 'bg-white text-slate-950 shadow-sm dark:bg-black dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}
                        >
                            رحلاتي
                        </button>
                        {canViewIncoming ? (
                            <button
                                onClick={() => setActiveTab('incoming')}
                                className={`flex-1 rounded-[1rem] py-3 text-sm font-black transition ${activeTab === 'incoming' ? 'bg-white text-slate-950 shadow-sm dark:bg-black dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}
                            >
                                الطلبات الواردة
                                {incomingStats.pending > 0 ? <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-rose-500 align-middle" /> : null}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
                {error ? (
                    <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-rose-600 dark:bg-rose-950/20 dark:text-rose-300">
                        <span className="material-symbols-outlined shrink-0">error</span>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{error}</p>
                            {isTimeout ? <p className="mt-1 text-xs">الخادم تأخر في الاستجابة، وتم إيقاف الانتظار تلقائياً.</p> : null}
                            <button onClick={() => void fetchData()} className="mt-2 text-xs font-bold hover:underline">المحاولة مرة أخرى</button>
                        </div>
                    </div>
                ) : null}

                {activeTab === 'trips' ? (
                    myBookings.length === 0 ? (
                        <EmptyState icon="calendar_month" text="لا توجد رحلات أو حجوزات حالية." />
                    ) : (
                        myBookings.map((booking) => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                audience="tenant"
                                onOpenConversation={openConversation}
                                onCancel={cancelBooking}
                                onDecision={(target, action) => setDecisionTarget({ booking: target, action })}
                            />
                        ))
                    )
                ) : incomingRequests.length === 0 ? (
                    <EmptyState icon="notifications_off" text="لا توجد طلبات واردة حالياً." />
                ) : (
                    incomingRequests.map((booking) => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            audience="landlord"
                            onOpenConversation={openConversation}
                            onCancel={cancelBooking}
                            onDecision={(target, action) => setDecisionTarget({ booking: target, action })}
                        />
                    ))
                )}
            </div>

            <BookingDecisionDialog
                open={Boolean(decisionTarget)}
                action={decisionTarget?.action || 'landlord_confirm'}
                bookingTitle={decisionTarget?.booking.propertyTitle || 'الحجز'}
                guestName={decisionTarget?.booking.guestName}
                loading={decisionLoading}
                onClose={() => {
                    if (!decisionLoading) setDecisionTarget(null);
                }}
                onSubmit={submitDecision}
            />
        </main>
    );
}
