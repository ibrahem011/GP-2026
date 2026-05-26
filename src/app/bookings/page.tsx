'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    canLandlordRespondToBooking,
    canTenantCancelBooking,
    getBookingStatusBadgeClass,
    getBookingStatusLabel,
    normalizeBookingStatus,
} from '@/lib/bookingPresentation';
import { getIsMockMode, supabaseService } from '@/services/supabaseService';

type BookingTab = 'trips' | 'incoming';


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

const formatBookingDate = (date: string) => new Date(date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });

const getOtherPartyName = (booking: BookingListItem, audience: 'tenant' | 'landlord') => (
    audience === 'tenant' ? booking.ownerName || 'غير متوفر' : booking.guestName || 'غير متوفر'
);

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

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 py-16 text-center dark:border-[#2a3142]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-[#1e2130]">
                <span className="material-symbols-outlined text-3xl text-[#4e5f97] dark:text-slate-400">{icon}</span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#0e111b] dark:text-white">{title}</h3>
            <p className="max-w-xs text-sm leading-relaxed text-[#4e5f97] dark:text-slate-400">{description}</p>
        </div>
    );
}

function BookingCard({
    booking,
    audience,
    isSelected,
    onClick,
}: {
    booking: BookingListItem;
    audience: 'tenant' | 'landlord';
    isSelected?: boolean;
    onClick?: () => void;
}) {


    const otherPartyName = getOtherPartyName(booking, audience);

    return (
        <article
            onClick={onClick}
            className={`rounded-[18px] border bg-[#fcfdff] p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] transition sm:rounded-[22px] sm:p-5 dark:bg-[#1e2130] lg:cursor-pointer lg:p-4 ${
                isSelected
                    ? 'border-primary ring-2 ring-primary/20 dark:border-primary'
                    : 'border-slate-200/80 hover:border-primary/45 hover:bg-white dark:border-[#2a3142] dark:hover:border-primary/70'
            }`}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start lg:items-center lg:gap-5">
                <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-[14px] bg-slate-100 sm:h-32 sm:w-32 lg:h-24 lg:w-32 dark:bg-[#121520]">
                    {booking.propertyImage ? (
                        <img src={booking.propertyImage} className="h-full w-full object-cover" alt={booking.propertyTitle} />
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600">
                            <span className="material-symbols-outlined text-3xl">image</span>
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row lg:items-center">
                        <div className="min-w-0">
                            <h3 className="line-clamp-2 text-lg font-black leading-7 text-[#0e111b] dark:text-white lg:text-base lg:leading-6">{booking.propertyTitle}</h3>
                            <p className="mt-1 flex items-center gap-1 text-sm text-[#4e5f97] dark:text-slate-300">
                                <span className="material-symbols-outlined text-[16px]">person</span>
                                {audience === 'tenant' ? `المؤجر: ${otherPartyName}` : `الضيف: ${otherPartyName}`}
                            </p>
                        </div>
                        <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold lg:shrink-0 ${getBookingStatusBadgeClass(booking.status)}`}>
                            {getBookingStatusLabel(booking.status)}
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-[#4e5f97] sm:grid-cols-3 lg:grid-cols-4 dark:text-slate-300">
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-[#121520]">
                            <span className="material-symbols-outlined text-[18px] opacity-70">location_on</span>
                            <span className="truncate">{booking.location}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-[#121520]">
                            <span className="material-symbols-outlined text-[18px] opacity-70">bedtime</span>
                            <span>{calculateNights(booking.startDate, booking.endDate)} ليالٍ</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 sm:col-span-1 dark:bg-[#121520]">
                            <span className="material-symbols-outlined text-[18px] opacity-70">payments</span>
                            <span className="font-bold text-[#0e111b] dark:text-white">{booking.totalAmount.toLocaleString('ar-EG')} ج.م</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 sm:col-span-3 lg:col-span-1 dark:bg-[#121520]">
                            <span className="material-symbols-outlined text-[18px] opacity-70">calendar_month</span>
                            <span className="truncate">{formatBookingDate(booking.startDate)} - {formatBookingDate(booking.endDate)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center dark:border-[#2a3142] lg:hidden">
                <Link
                    href={`/bookings/${booking.id}?view=${audience}`}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                >
                    <span className="material-symbols-outlined text-[18px]">article</span>
                    تفاصيل الحجز
                </Link>
            </div>
        </article>
    );
}



function BookingDetailsPanel({
    booking,
    audience,
}: {
    booking: BookingListItem;
    audience: 'tenant' | 'landlord';
}) {

    const otherPartyName = getOtherPartyName(booking, audience);

    return (
        <aside className="sticky top-6 overflow-hidden rounded-[22px] border border-slate-200/80 bg-[#fcfdff] shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)] dark:border-[#2a3142] dark:bg-[#1e2130]">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-[#2a3142]">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold text-[#4e5f97] dark:text-slate-400">تفاصيل الحجز</p>
                        <p className="mt-1 font-mono text-xs text-slate-400">#{booking.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center rounded-lg px-3 py-1 text-xs font-bold ${getBookingStatusBadgeClass(booking.status)}`}>
                        {getBookingStatusLabel(booking.status)}
                    </span>
                </div>
            </div>

            <div className="max-h-[calc(100vh-245px)] overflow-y-auto px-5 py-5">
                <div className="flex gap-4">
                    <div className="h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-[#121520]">
                        {booking.propertyImage ? (
                            <img src={booking.propertyImage} className="h-full w-full object-cover" alt={booking.propertyTitle} />
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600">
                                <span className="material-symbols-outlined text-3xl">image</span>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-3 text-lg font-black leading-7 text-[#0e111b] dark:text-white">{booking.propertyTitle}</h2>
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#4e5f97] dark:text-slate-400">
                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                            {booking.location}
                        </p>
                    </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-[#2a3142] dark:bg-[#121520]">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0e111b] dark:text-white">
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        {audience === 'tenant' ? 'بيانات المؤجر' : 'بيانات الضيف'}
                    </h4>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary dark:bg-primary/20">
                            {(audience === 'tenant' ? booking.ownerName : booking.guestName)?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate font-bold text-[#0e111b] dark:text-white">
                                {otherPartyName}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0e111b] dark:text-white">
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        تفاصيل الإقامة
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-[#2a3142] dark:bg-[#1e2130]">
                            <p className="mb-1 text-xs font-bold text-[#4e5f97] dark:text-slate-400">الوصول</p>
                            <p className="text-sm font-black text-[#0e111b] dark:text-white">{formatBookingDate(booking.startDate)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-[#2a3142] dark:bg-[#1e2130]">
                            <p className="mb-1 text-xs font-bold text-[#4e5f97] dark:text-slate-400">المغادرة</p>
                            <p className="text-sm font-black text-[#0e111b] dark:text-white">{formatBookingDate(booking.endDate)}</p>
                        </div>
                    </div>
                    <p className="mt-2 text-center text-xs font-bold text-[#4e5f97] dark:text-slate-400">
                        {calculateNights(booking.startDate, booking.endDate)} ليالٍ
                    </p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5 dark:border-[#2a3142]">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0e111b] dark:text-white">
                        <span className="material-symbols-outlined text-[18px]">payments</span>
                        الملخص المالي
                    </h4>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-[#121520]">
                        <span className="text-sm font-bold text-[#4e5f97] dark:text-slate-400">إجمالي التكلفة</span>
                        <span className="text-lg font-black text-[#0e111b] dark:text-white">{booking.totalAmount.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 p-4 dark:border-[#2a3142] dark:bg-[#121520]">
                <Link
                    href={`/bookings/${booking.id}?view=${audience}`}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                >
                    <span className="material-symbols-outlined text-[18px]">article</span>
                    تفاصيل الحجز
                </Link>
            </div>
        </aside>
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
// Desktop View States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

    const currentList = activeTab === 'trips' ? myBookings : incomingRequests;

    const filteredBookings = useMemo(() => {
        return currentList.filter(booking => {
            const matchesSearch = 
                (booking.propertyTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (booking.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (booking.guestName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                booking.id.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || normalizeBookingStatus(booking.status) === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [currentList, searchQuery, statusFilter]);

    useEffect(() => {
        if (filteredBookings.length > 0) {
            if (!selectedBookingId || !filteredBookings.find(b => b.id === selectedBookingId)) {
                setSelectedBookingId(filteredBookings[0].id);
            }
        } else {
            setSelectedBookingId(null);
        }
    }, [filteredBookings, selectedBookingId]);
    
    useEffect(() => {
        setSearchQuery('');
        setStatusFilter('all');
    }, [activeTab]);

    const selectedBooking = useMemo(() => {
        return filteredBookings.find(b => b.id === selectedBookingId) || null;
    }, [filteredBookings, selectedBookingId]);

    const timeoutMessage = 'تأخرت استجابة الخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    const genericErrorMessage = 'تعذر تحميل الحجوزات. يرجى المحاولة مرة أخرى لاحقاً.';

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
                maxRetries: 0,
                retryOnTimeout: false,
                operationKey: 'bookingsPage',
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

    const visibleTotalAmount = useMemo(
        () => filteredBookings.reduce((total, booking) => total + booking.totalAmount, 0),
        [filteredBookings],
    );
if (isAuthLoading || loading) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7fb] pb-28 dark:bg-[#121520]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="mt-4 text-sm font-bold text-[#4e5f97] dark:text-slate-400">جاري تحميل الحجوزات...</p>
            </main>
        );
    }

    if (!user && !getIsMockMode()) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7fb] p-4 pb-28 dark:bg-[#121520]">
                <div className="w-full max-w-sm rounded-[24px] border border-slate-200/70 bg-white p-8 text-center shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:border-[#2a3142] dark:bg-[#1e2130]">
                    <span className="material-symbols-outlined mb-4 text-6xl text-[#4e5f97] dark:text-slate-400">lock</span>
                    <h2 className="mb-2 text-xl font-black text-[#0e111b] dark:text-white">تسجيل الدخول مطلوب</h2>
                    <p className="mb-6 text-sm leading-7 text-[#4e5f97] dark:text-slate-300">
                        قم بتسجيل الدخول لتتمكن من متابعة وإدارة حجوزاتك بسهولة.
                    </p>
                    <button
                        onClick={() => router.push('/auth?mode=login&redirect=/bookings')}
                        className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary px-4 py-2 font-bold text-white transition-colors hover:bg-primary/90"
                    >
                        تسجيل الدخول
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f6f7fb] pb-28 dark:bg-[#121520]">
            <div className="border-b border-slate-200/70 bg-[#f6f7fb] dark:border-[#2a3142] dark:bg-[#121520]">
                <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 lg:max-w-[1280px]">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/')}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#4e5f97] transition-colors hover:text-primary dark:border-[#2a3142] dark:bg-[#1e2130] dark:text-slate-300 dark:hover:text-white"
                            aria-label="العودة إلى الرئيسية"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-2xl font-black text-[#0e111b] dark:text-white">الحجوزات</h1>
                            <p className="mt-1 truncate text-sm text-[#4e5f97] dark:text-slate-400">تابع حجوزاتك القادمة وأدر الطلبات بسهولة.</p>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <button
                            type="button"
                            aria-label="عرض الرحلات"
                            onClick={() => setActiveTab('trips')}
                            className={`min-h-[104px] rounded-[18px] border px-5 py-4 text-right shadow-sm transition-all lg:cursor-pointer ${activeTab === 'trips' ? 'border-primary bg-[#fcfdff] ring-2 ring-primary/15 dark:bg-[#1e2130] dark:border-primary' : 'border-slate-200/80 bg-[#fcfdff]/70 hover:bg-[#fcfdff] dark:border-[#2a3142] dark:bg-[#1e2130]/60 dark:hover:bg-[#1e2130]'}`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-bold text-[#4e5f97] dark:text-slate-400">حجوزاتي</div>
                                <span className="material-symbols-outlined text-xl text-[#4e5f97] opacity-60 dark:text-slate-400">calendar_month</span>
                            </div>
                            <div className="mt-4 flex items-end justify-between gap-3">
                                <span className="text-3xl font-black text-[#0e111b] dark:text-white">{tripStats.total.toLocaleString('ar-EG')}</span>
                                {tripStats.pending > 0 && (
                                    <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                        {tripStats.pending.toLocaleString('ar-EG')} قيد الانتظار
                                    </span>
                                )}
                            </div>
                        </button>

                        {canViewIncoming && (
                            <button
                                type="button"
                                aria-label="عرض الطلبات الواردة"
                                onClick={() => setActiveTab('incoming')}
                                className={`min-h-[104px] rounded-[18px] border px-5 py-4 text-right shadow-sm transition-all lg:cursor-pointer ${activeTab === 'incoming' ? 'border-primary bg-[#fcfdff] ring-2 ring-primary/15 dark:bg-[#1e2130] dark:border-primary' : 'border-slate-200/80 bg-[#fcfdff]/70 hover:bg-[#fcfdff] dark:border-[#2a3142] dark:bg-[#1e2130]/60 dark:hover:bg-[#1e2130]'}`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-bold text-[#4e5f97] dark:text-slate-400">الطلبات الواردة</div>
                                    <span className="material-symbols-outlined text-xl text-[#4e5f97] opacity-60 dark:text-slate-400">inbox</span>
                                </div>
                                <div className="mt-4 flex items-end justify-between gap-3">
                                    <span className="text-3xl font-black text-[#0e111b] dark:text-white">{incomingStats.total.toLocaleString('ar-EG')}</span>
                                    {incomingStats.pending > 0 && (
                                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                            {incomingStats.pending.toLocaleString('ar-EG')} طلب جديد
                                        </span>
                                    )}
                                </div>
                            </button>
                        )}

                        <div className="min-h-[104px] rounded-[18px] border border-slate-200/80 bg-[#fcfdff]/70 px-5 py-4 shadow-sm dark:border-[#2a3142] dark:bg-[#1e2130]/60">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-bold text-[#4e5f97] dark:text-slate-400">المعروض الآن</div>
                                <span className="material-symbols-outlined text-xl text-[#4e5f97] opacity-60 dark:text-slate-400">view_list</span>
                            </div>
                            <div className="mt-4 flex items-end justify-between gap-3">
                                <span className="text-3xl font-black text-[#0e111b] dark:text-white">{filteredBookings.length.toLocaleString('ar-EG')}</span>
                                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-[#4e5f97] dark:bg-[#121520] dark:text-slate-400">
                                    {activeTab === 'trips' ? 'رحلة' : 'طلب'}
                                </span>
                            </div>
                        </div>

                        <div className="min-h-[104px] rounded-[18px] border border-slate-200/80 bg-[#fcfdff]/70 px-5 py-4 shadow-sm dark:border-[#2a3142] dark:bg-[#1e2130]/60">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-bold text-[#4e5f97] dark:text-slate-400">إجمالي المبالغ</div>
                                <span className="material-symbols-outlined text-xl text-[#4e5f97] opacity-60 dark:text-slate-400">payments</span>
                            </div>
                            <div className="mt-4 flex items-end justify-between gap-3">
                                <span className="text-2xl font-black text-[#0e111b] dark:text-white">{visibleTotalAmount.toLocaleString('ar-EG')}</span>
                                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-[#4e5f97] dark:bg-[#121520] dark:text-slate-400">ج.م</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex rounded-xl bg-slate-200/50 p-1 dark:bg-[#1e2130]">
                        <button
                            onClick={() => setActiveTab('trips')}
                            className={`flex min-h-[44px] flex-1 items-center justify-center rounded-lg text-sm font-bold transition-all ${activeTab === 'trips' ? 'bg-white text-[#0e111b] shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-[#2a3142] dark:text-white' : 'text-[#4e5f97] hover:text-[#0e111b] dark:text-slate-400 dark:hover:text-white'}`}
                        >
                            حجوزاتي
                        </button>
                        {canViewIncoming ? (
                            <button
                                onClick={() => setActiveTab('incoming')}
                                className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'incoming' ? 'bg-white text-[#0e111b] shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-[#2a3142] dark:text-white' : 'text-[#4e5f97] hover:text-[#0e111b] dark:text-slate-400 dark:hover:text-white'}`}
                            >
                                الطلبات
                                {incomingStats.pending > 0 ? <span className="inline-block h-2 w-2 rounded-full bg-rose-500" /> : null}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:py-8 lg:max-w-[1280px]">
                {error ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-200/50 bg-rose-50 p-4 text-rose-600 dark:border-rose-900/30 dark:bg-rose-500/10 dark:text-rose-400 max-w-4xl">
                        <span className="material-symbols-outlined shrink-0">error</span>
                        <div className="flex-1">
                            <p className="text-sm font-bold">{error}</p>
                            {isTimeout ? <p className="mt-1 text-xs opacity-80">يرجى التحقق من اتصالك والمحاولة لاحقاً.</p> : null}
                            <button onClick={() => void fetchData()} className="mt-3 text-xs font-bold underline decoration-rose-300 underline-offset-4 hover:decoration-rose-600 dark:decoration-rose-700 dark:hover:decoration-rose-400">
                                المحاولة مرة أخرى
                            </button>
                        </div>
                    </div>
                ) : null}

                {/* Desktop Toolbar */}
                <div className="hidden items-center justify-between gap-4 lg:flex">
                    <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-[#fcfdff] p-1 shadow-sm dark:border-[#2a3142] dark:bg-[#1e2130]">
                        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => {
                            const label = status === 'all' ? 'الكل' : getBookingStatusLabel(status);
                            return (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                                        statusFilter === status
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                            : 'text-[#4e5f97] hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-[#2a3142]'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="relative w-[340px]">
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="بحث بالاسم، العقار، رقم الحجز..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-[#fcfdff] py-2.5 pl-10 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-[#2a3142] dark:bg-[#1e2130] dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-start gap-5 lg:flex-row">
                    {/* List Column */}
                    <div className="flex-1 space-y-4 w-full">
                        {filteredBookings.length === 0 ? (
                            <EmptyState
                                icon={activeTab === 'trips' ? "calendar_add_on" : "inbox"}
                                title={searchQuery || statusFilter !== 'all' ? "لا توجد نتائج مطابقة" : activeTab === 'trips' ? "لا توجد رحلات قادمة" : "لا توجد طلبات واردة"}
                                description={searchQuery || statusFilter !== 'all' ? "لم نعثر على أي حجوزات تطابق خيارات البحث الحالية. حاول تغيير الفلاتر." : activeTab === 'trips' ? "لم تقم بحجز أي عقار حتى الآن." : "ليس لديك أي طلبات حجز معلقة."}
                            />
                        ) : (
                            filteredBookings.map((booking) => (
                                <BookingCard
                                    key={booking.id}
                                    booking={booking}
                                    audience={activeTab === 'trips' ? 'tenant' : 'landlord'}
                                    isSelected={booking.id === selectedBookingId}
                                    onClick={() => setSelectedBookingId(booking.id)}
                                />
                            ))
                        )}
                    </div>

                    {/* Details Side Panel (Desktop only) */}
                    {selectedBooking && (
                        <div className="hidden w-[360px] shrink-0 lg:block">
                            <BookingDetailsPanel
                                booking={selectedBooking}
                                audience={activeTab === 'trips' ? 'tenant' : 'landlord'}
                            />
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
