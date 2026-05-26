'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnlockModal } from '@/components/UnlockModal';
import { resolveFeature } from '@/config/features';
import { ImageSkeleton } from '@/components/ImageSkeleton';
import { getPropertyImageUrl, normalizePropertyImageList } from '@/lib/propertyImages';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { supabaseService } from '@/services/supabaseService';
import { CATEGORY_AR, PRICE_UNIT_AR } from '@/types';
import type { Property, PublicBookingPeriod, TenantPropertyState } from '@/types';
import type { UserProfile } from '@/services/supabaseService';

const PropertyLocationMap = dynamic(() => import('@/components/PropertyLocationMap'), {
    ssr: false,
    loading: () => (
        <div className="flex h-[320px] w-full items-center justify-center rounded-3xl bg-gray-100 dark:bg-gray-800">
            <div className="flex flex-col items-center text-gray-400">
                <span className="material-symbols-outlined mb-2 text-4xl">map</span>
                <span className="text-sm">جارٍ تحميل الخريطة...</span>
            </div>
        </div>
    ),
});

interface ClientPropertyDetailsProps {
    initialProperty: Property;
}

const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

const formatDateTime = (value: string) =>
    new Date(value).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

function BookingStateCard({
    title,
    subtitle,
    badgeClassName,
    badgeLabel,
    onOpenBookings,
    onMessageOwner,
}: {
    title: string;
    subtitle: string;
    badgeClassName: string;
    badgeLabel: string;
    onOpenBookings: () => void;
    onMessageOwner: () => void;
}) {
    return (
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${badgeClassName}`}>
                        {badgeLabel}
                    </p>
                    <h3 className="mt-3 text-base font-bold text-gray-900 dark:text-white">{title}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-zinc-300">{subtitle}</p>
                </div>
                <span className="material-symbols-outlined rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                    event_available
                </span>
            </div>

            <div className="mt-4 flex gap-3">
                <button
                    type="button"
                    onClick={onOpenBookings}
                    className="flex-1 min-h-11 rounded-2xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                    عرض حجوزاتي
                </button>
                <button
                    type="button"
                    onClick={onMessageOwner}
                    className="flex-1 min-h-11 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    مراسلة المالك
                </button>
            </div>
        </div>
    );
}

function clampIndex(index: number, length: number) {
    return Math.min(Math.max(index, 0), Math.max(length - 1, 0));
}

export default function ClientPropertyDetails({ initialProperty }: ClientPropertyDetailsProps) {
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [heroImageLoaded, setHeroImageLoaded] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [publicPeriods, setPublicPeriods] = useState<PublicBookingPeriod[]>([]);
    const [tenantState, setTenantState] = useState<TenantPropertyState | null>(null);
    const [ownerProfile, setOwnerProfile] = useState<UserProfile | null | undefined>(undefined);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);
    const [isBottomPanelAutoHidden, setIsBottomPanelAutoHidden] = useState(false);
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const carouselScrollFrameRef = useRef<number | null>(null);
    const prevScrollYRef = useRef(0);
    const bottomPanelFrameRef = useRef<number | null>(null);
    const { showToast } = useToast();
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    const galleryImages = useMemo(
        () =>
            normalizePropertyImageList(initialProperty.images).map((image) =>
                getPropertyImageUrl(image),
            ),
        [initialProperty.images],
    );
    const propertyFeatures = useMemo(
        () => initialProperty.features.map((feature) => resolveFeature(feature)),
        [initialProperty.features],
    );

    const nextPublicPeriod = publicPeriods[0] || null;
    const latestBooking = tenantState?.latestBooking || null;
    const hasPreciseLocation =
        typeof initialProperty.location.lat === 'number' && typeof initialProperty.location.lng === 'number';
    const propertyAddress = initialProperty.location.address || initialProperty.location.area || 'جمصة';
    const propertyArea = initialProperty.location.area || 'جمصة';
    const canNavigateImages = galleryImages.length > 1;
    const canAccessBooking = useMemo(
        () => Boolean(tenantState?.unlockedAt || tenantState?.hasBookingHistory),
        [tenantState?.hasBookingHistory, tenantState?.unlockedAt],
    );
    const pendingBooking =
        latestBooking && (latestBooking.status === 'pending' || latestBooking.status === 'requested')
            ? latestBooking
            : null;
    const confirmedBooking =
        latestBooking && (latestBooking.status === 'confirmed' || latestBooking.status === 'active')
            ? latestBooking
            : null;
    const pendingUnlockRequest = tenantState?.unlockRequestStatus === 'pending';
    const ownerProfileName = ownerProfile?.full_name?.trim() || '';
    const ownerAvatar = ownerProfile?.avatar_url?.trim() || '';
    const ownerDisplayName = ownerProfile?.is_verified
        ? ownerProfileName || initialProperty.ownerName || 'صاحب العقار'
        : initialProperty.ownerName.trim() || ownerProfileName || 'صاحب العقار';
    const ownerInitial = ownerDisplayName.charAt(0) || 'م';
    const ownerVerificationLabel =
        ownerProfile === undefined
            ? 'جارٍ التحقق من الحساب'
            : ownerProfile?.is_verified
                ? 'المالك موثق'
                : 'حساب المالك غير موثق';
    const ownerVerificationIcon =
        ownerProfile === undefined ? 'hourglass_top' : ownerProfile?.is_verified ? 'verified_user' : 'shield';
    const ownerVerificationClassName =
        ownerProfile === undefined
            ? 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300'
            : ownerProfile?.is_verified
                ? 'bg-green-500/10 text-green-600 dark:bg-green-950/40 dark:text-green-300'
                : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300';
    const bookingSummary = pendingBooking
        ? `تم إرسال الطلب في ${formatDateTime(pendingBooking.createdAt)}. موعد الاستلام ${formatDate(
              pendingBooking.startDate,
          )}.`
        : confirmedBooking
            ? `العقار محجوز لك من ${formatDate(confirmedBooking.startDate)} إلى ${formatDate(
                  confirmedBooking.endDate,
              )}. موعد الاستلام ${formatDate(confirmedBooking.startDate)}.`
            : '';
    const collapsedPanelSummary = confirmedBooking
        ? 'حجز مؤكد'
        : pendingBooking
            ? 'طلبك قيد المراجعة'
            : canAccessBooking
                ? 'الحجز متاح الآن'
                : pendingUnlockRequest
                    ? 'طلب فك القفل قيد المراجعة'
                    : nextPublicPeriod
                        ? 'العقار غير متاح في أقرب فترة'
                        : 'تفاصيل الحجز';

    useEffect(() => {
        let mounted = true;
        const loadPublicPeriods = async () => {
            const periods = await supabaseService.getPublicBookingPeriods(initialProperty.id);
            if (mounted) {
                setPublicPeriods(periods);
            }
        };
        void loadPublicPeriods();
        return () => {
            mounted = false;
        };
    }, [initialProperty.id]);

    useEffect(() => {
        let mounted = true;
        const loadOwnerProfile = async () => {
            const profile = await supabaseService.getProfileById(initialProperty.ownerId);
            if (mounted) {
                setOwnerProfile(profile);
            }
        };
        void loadOwnerProfile();
        return () => {
            mounted = false;
        };
    }, [initialProperty.ownerId]);

    useEffect(() => {
        let mounted = true;
        const loadTenantState = async () => {
            if (!user) {
                if (mounted) {
                    setTenantState(null);
                }
                return;
            }

            const nextState = await supabaseService.getTenantPropertyState(user.id, initialProperty.id);
            if (mounted) {
                setTenantState(nextState);
            }
        };
        void loadTenantState();
        return () => {
            mounted = false;
        };
    }, [initialProperty.id, user]);

    useEffect(() => {
        let mounted = true;
        const loadFavoriteState = async () => {
            if (!user) {
                if (mounted) {
                    setIsFavorite(false);
                }
                return;
            }

            const { data: favorites } = await supabaseService.getFavorites(user.id);
            if (mounted) {
                setIsFavorite(favorites.some((favorite) => favorite.id === initialProperty.id));
            }
        };
        void loadFavoriteState();
        return () => {
            mounted = false;
        };
    }, [initialProperty.id, user]);

    useEffect(() => {
        const container = carouselRef.current;
        if (!container || !canNavigateImages) return;

        const handleScroll = () => {
            if (carouselScrollFrameRef.current) return;
            carouselScrollFrameRef.current = requestAnimationFrame(() => {
                const nextIndex = clampIndex(
                    Math.round(container.scrollLeft / Math.max(container.clientWidth, 1)),
                    galleryImages.length,
                );
                setActiveImageIndex((prevIndex) => (prevIndex === nextIndex ? prevIndex : nextIndex));
                carouselScrollFrameRef.current = null;
            });
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (carouselScrollFrameRef.current) {
                cancelAnimationFrame(carouselScrollFrameRef.current);
                carouselScrollFrameRef.current = null;
            }
        };
    }, [canNavigateImages, galleryImages.length]);

    useEffect(() => {
        const handleScroll = () => {
            if (bottomPanelFrameRef.current) return;
            bottomPanelFrameRef.current = requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

                if (currentScrollY <= 0) {
                    setIsBottomPanelAutoHidden(false);
                    prevScrollYRef.current = currentScrollY;
                    bottomPanelFrameRef.current = null;
                    return;
                }

                if (currentScrollY >= maxScrollable) {
                    prevScrollYRef.current = currentScrollY;
                    bottomPanelFrameRef.current = null;
                    return;
                }

                const delta = currentScrollY - prevScrollYRef.current;
                if (delta > 12) {
                    setIsBottomPanelAutoHidden(true);
                } else if (delta < -12) {
                    setIsBottomPanelAutoHidden(false);
                }

                prevScrollYRef.current = currentScrollY;
                bottomPanelFrameRef.current = null;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (bottomPanelFrameRef.current) {
                cancelAnimationFrame(bottomPanelFrameRef.current);
                bottomPanelFrameRef.current = null;
            }
        };
    }, []);

    const scrollToImage = (index: number) => {
        const container = carouselRef.current;
        if (!container) return;
        const boundedIndex = clampIndex(index, galleryImages.length);
        container.scrollTo({
            left: boundedIndex * container.clientWidth,
            behavior: 'smooth',
        });
        setActiveImageIndex(boundedIndex);
    };

    const handleUnlockClick = () => {
        if (!isAuthenticated) {
            router.push(`/auth?mode=login&redirect=${encodeURIComponent(`/property/${initialProperty.id}`)}`);
            return;
        }
        setShowUnlockModal(true);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: initialProperty.title,
                    text: `شاهد هذا العقار في جمصة: ${initialProperty.title}`,
                    url: window.location.href,
                });
                return;
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }
                console.error('Error sharing property:', error);
            }
        }

        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast('تم نسخ الرابط.', 'success');
        } catch (error) {
            console.error('Error copying property link:', error);
            showToast('تعذر نسخ الرابط. حاول مرة أخرى.', 'error');
        }
    };

    const handleFavoriteClick = async () => {
        if (!isAuthenticated || !user) {
            router.push(`/auth?mode=login&redirect=${encodeURIComponent(`/property/${initialProperty.id}`)}`);
            return;
        }

        const previousValue = isFavorite;
        setIsFavorite(!previousValue);

        try {
            await supabaseService.toggleFavorite(user.id, initialProperty.id);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            setIsFavorite(previousValue);
            showToast('تعذر تحديث المفضلة. حاول مرة أخرى.', 'error');
        }
    };

    const handleBookingClick = () => {
        if (!isAuthenticated) {
            router.push(`/auth?mode=login&redirect=${encodeURIComponent(`/property/${initialProperty.id}/booking`)}`);
            return;
        }
        router.push(`/property/${initialProperty.id}/booking`);
    };

    const handleMessageOwner = async () => {
        if (!user) {
            router.push('/auth');
            return;
        }

        const conversationId = await supabaseService.createConversation({
            propertyId: initialProperty.id,
            buyerId: user.id,
            ownerId: initialProperty.ownerId,
        });
        router.push(`/messages/${conversationId}`);
    };

    return (
        <main className="min-h-screen bg-background-light pb-56 dark:bg-background-dark">
            <section className="relative min-h-[360px] overflow-hidden bg-slate-950 md:min-h-[480px]">
                {!heroImageLoaded && (
                    <div className="absolute inset-0 z-10">
                        <ImageSkeleton />
                    </div>
                )}

                <div
                    ref={carouselRef}
                    dir="ltr"
                    className="hide-scrollbar flex h-[44vh] min-h-[360px] snap-x snap-mandatory overflow-x-auto scroll-smooth md:h-[58vh] md:min-h-[480px]"
                >
                    {galleryImages.map((image, index) => (
                        <div key={`${image}-${index}`} className="relative h-full w-full shrink-0 snap-start">
                            <Image
                                src={image}
                                alt={`${initialProperty.title} - صورة ${index + 1}`}
                                fill
                                priority={index === 0}
                                loading={index === 0 ? undefined : 'lazy'}
                                className={`object-cover transition-opacity duration-500 ${
                                    heroImageLoaded || index > 0 ? 'opacity-100' : 'opacity-0'
                                }`}
                                sizes="100vw"
                                onLoad={() => {
                                    if (index === 0) {
                                        setHeroImageLoaded(true);
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/20" />

                <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex touch-target items-center justify-center rounded-full bg-slate-950/35 text-white backdrop-blur-md transition hover:bg-slate-950/50 focus-visible:ring-2 focus-visible:ring-primary/60"
                        aria-label="الرجوع"
                    >
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleFavoriteClick}
                            className={`flex touch-target items-center justify-center rounded-full backdrop-blur-md transition focus-visible:ring-2 focus-visible:ring-primary/60 ${
                                isFavorite ? 'bg-surface-light text-error shadow-lg' : 'bg-slate-950/35 text-white hover:bg-slate-950/50'
                            }`}
                            aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                        >
                            <span
                                className="material-symbols-outlined text-[22px]"
                                style={{ fontVariationSettings: `'FILL' ${isFavorite ? 1 : 0}` }}
                            >
                                favorite
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex touch-target items-center justify-center rounded-full bg-slate-950/35 text-white backdrop-blur-md transition hover:bg-slate-950/50 focus-visible:ring-2 focus-visible:ring-primary/60"
                            aria-label="مشاركة العقار"
                        >
                            <span className="material-symbols-outlined">share</span>
                        </button>
                    </div>
                </div>

                {canNavigateImages ? (
                    <>
                        <button
                            type="button"
                            onClick={() => scrollToImage(activeImageIndex - 1)}
                            disabled={activeImageIndex === 0}
                            className="absolute left-4 top-1/2 z-20 flex touch-target -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/35 text-white backdrop-blur-md transition hover:bg-slate-950/50 focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="الصورة السابقة"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToImage(activeImageIndex + 1)}
                            disabled={activeImageIndex === galleryImages.length - 1}
                            className="absolute right-4 top-1/2 z-20 flex touch-target -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/35 text-white backdrop-blur-md transition hover:bg-slate-950/50 focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="الصورة التالية"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4 pb-6">
                    <div className="rounded-full bg-slate-950/35 px-4 py-1 text-xs font-bold text-white backdrop-blur-md">
                        {activeImageIndex + 1} / {galleryImages.length}
                    </div>

                    {canNavigateImages ? (
                        <div className="flex items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-md">
                            {galleryImages.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => scrollToImage(index)}
                                    className={`h-2.5 rounded-full transition-all ${
                                        index === activeImageIndex
                                            ? 'w-6 bg-white'
                                            : 'w-2.5 bg-white/50 hover:bg-white/70'
                                    }`}
                                    aria-label={`الانتقال إلى الصورة ${index + 1}`}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="relative z-10 mx-auto -mt-14 max-w-4xl px-4" dir="rtl">
                <div className="rounded-3xl border border-slate-200 bg-surface-light p-5 shadow-[0_18px_48px_-32px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-surface-dark md:p-6">
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                                    {CATEGORY_AR[initialProperty.category]}
                                </span>
                                {initialProperty.isVerified ? (
                                    <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-600 dark:bg-green-950/40 dark:text-green-300">
                                        <span className="material-symbols-outlined text-[14px]">fact_check</span>
                                        العقار مراجع
                                    </span>
                                ) : null}
                                {initialProperty.status === 'pending' ? (
                                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
                                        <span className="material-symbols-outlined text-[14px]">pending_actions</span>
                                        قيد المراجعة
                                    </span>
                                ) : initialProperty.status === 'rented' ? (
                                    <span className="flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                                        <span className="material-symbols-outlined text-[14px]">event_busy</span>
                                        محجوز
                                    </span>
                                ) : null}
                            </div>

                            <h1 className="mb-2 text-2xl font-black leading-snug text-gray-900 dark:text-white md:text-3xl">
                                {initialProperty.title}
                            </h1>
                            <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                                {propertyAddress}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-right sm:text-left">
                            <p className="text-2xl font-black text-primary md:text-3xl">
                                {initialProperty.price.toLocaleString('ar-EG')} <span className="text-sm font-normal">ج.م</span>
                            </p>
                            <p className="mt-1 text-xs font-bold text-gray-500 dark:text-gray-300">لكل {PRICE_UNIT_AR[initialProperty.priceUnit]}</p>
                        </div>
                    </div>

                    <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-surface-dim p-2 dark:border-white/10 dark:bg-white/5">
                        <div className="rounded-xl bg-surface-light px-2 py-3 text-center dark:bg-surface-dark">
                            <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
                            <p className="mt-1 text-[11px] font-bold text-gray-700 dark:text-gray-200">
                                {initialProperty.isVerified ? 'عقار مراجع' : 'بيانات قابلة للمراجعة'}
                            </p>
                        </div>
                        <div className="rounded-xl bg-surface-light px-2 py-3 text-center dark:bg-surface-dark">
                            <span className="material-symbols-outlined text-[20px] text-primary">event_available</span>
                            <p className="mt-1 text-[11px] font-bold text-gray-700 dark:text-gray-200">
                                {nextPublicPeriod ? 'توجد فترة محجوزة' : 'يمكن طلب الحجز'}
                            </p>
                        </div>
                        <div className="rounded-xl bg-surface-light px-2 py-3 text-center dark:bg-surface-dark">
                            <span className="material-symbols-outlined text-[20px] text-primary">photo_library</span>
                            <p className="mt-1 text-[11px] font-bold text-gray-700 dark:text-gray-200">
                                {galleryImages.length.toLocaleString('ar-EG')} صور للمعاينة
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/70">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-primary/10">
                                    {ownerAvatar ? (
                                        <Image
                                            src={ownerAvatar}
                                            alt={ownerDisplayName}
                                            fill
                                            className="object-cover"
                                            sizes="48px"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">
                                            {ownerInitial}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">صاحب العقار</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white md:text-base">
                                        {ownerDisplayName}
                                    </p>
                                </div>
                            </div>

                            <div
                                className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-xs font-bold ${ownerVerificationClassName}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">{ownerVerificationIcon}</span>
                                <span>{ownerVerificationLabel}</span>
                            </div>
                        </div>
                    </div>

                    {nextPublicPeriod ? (
                        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                            <div className="flex items-center gap-2 font-bold">
                                <span className="material-symbols-outlined text-[18px]">event_busy</span>
                                <span>العقار محجوز حالياً في أقرب فترة مؤكدة</span>
                            </div>
                            <p className="mt-1">
                                من {formatDate(nextPublicPeriod.startDate)} إلى {formatDate(nextPublicPeriod.endDate)}
                            </p>
                        </div>
                    ) : null}

                    <div className="my-6 grid grid-cols-3 gap-4 border-y border-gray-100 py-6 dark:border-gray-800">
                        <div className="group text-center">
                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 transition-colors group-hover:bg-primary/10 dark:bg-gray-800">
                                <span className="material-symbols-outlined text-gray-400 transition-colors group-hover:text-primary">bed</span>
                            </div>
                            <p className="text-xs text-gray-500">{initialProperty.bedrooms} غرف</p>
                        </div>
                        <div className="group text-center">
                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 transition-colors group-hover:bg-primary/10 dark:bg-gray-800">
                                <span className="material-symbols-outlined text-gray-400 transition-colors group-hover:text-primary">bathtub</span>
                            </div>
                            <p className="text-xs text-gray-500">{initialProperty.bathrooms} حمام</p>
                        </div>
                        <div className="group text-center">
                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 transition-colors group-hover:bg-primary/10 dark:bg-gray-800">
                                <span className="material-symbols-outlined text-gray-400 transition-colors group-hover:text-primary">straighten</span>
                            </div>
                            <p className="text-xs text-gray-500">{initialProperty.area} م²</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                            <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-[20px] text-primary">notes</span>
                            <span>عن هذا العقار</span>
                        </h2>
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 md:text-base">
                            {initialProperty.description}
                        </p>
                    </div>

                    <div className="mb-8">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                            <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-[20px] text-primary">map</span>
                            <span>الموقع على الخريطة</span>
                        </h2>

                        {hasPreciseLocation ? (
                            <PropertyLocationMap
                                lat={initialProperty.location.lat as number}
                                lng={initialProperty.location.lng as number}
                                title={initialProperty.title}
                                address={propertyAddress}
                            />
                        ) : (
                            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-950/50">
                                <span className="material-symbols-outlined text-4xl text-gray-400">location_off</span>
                                <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                                    الموقع الدقيق غير متاح بعد
                                </h3>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    تم حفظ عنوان العقار نصيًا، لكن لم يتم تحديد نقطة دقيقة على الخريطة لهذا العقار حتى الآن.
                                </p>
                            </div>
                        )}

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">العنوان</p>
                                <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{propertyAddress}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">المنطقة</p>
                                <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{propertyArea}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                            <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-[20px] text-primary">widgets</span>
                            <span>المميزات والخدمات</span>
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {propertyFeatures.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                                    <span className="material-symbols-outlined text-[20px] text-primary">{feature.icon}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{feature.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div
                className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
                    isBottomPanelAutoHidden ? 'translate-y-[120%]' : 'translate-y-0'
                }`}
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
            >
                <div className="mx-auto max-w-4xl px-4">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-surface-light/92 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-surface-dark/90">
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-white/10">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{collapsedPanelSummary}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {initialProperty.price.toLocaleString('ar-EG')} ج.م لكل {PRICE_UNIT_AR[initialProperty.priceUnit]}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsBottomPanelCollapsed((prevState) => !prevState);
                                    setIsBottomPanelAutoHidden(false);
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    {isBottomPanelCollapsed ? 'unfold_more' : 'unfold_less'}
                                </span>
                                {isBottomPanelCollapsed ? 'إظهار التفاصيل' : 'إخفاء التفاصيل'}
                            </button>
                        </div>

                        {isBottomPanelCollapsed ? (
                            <div className="flex items-center justify-between gap-3 px-4 py-4">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{collapsedPanelSummary}</p>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        اضغط على &quot;إظهار التفاصيل&quot; لعرض خيارات الحجز الكاملة.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsBottomPanelCollapsed(false);
                                        setIsBottomPanelAutoHidden(false);
                                    }}
                                    className="min-h-11 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50"
                                >
                                    إظهار التفاصيل
                                </button>
                            </div>
                        ) : (
                            <div className="p-4">
                                {confirmedBooking ? (
                                    <BookingStateCard
                                        title="تم حجزها من قبلك"
                                        subtitle={bookingSummary}
                                        badgeClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        badgeLabel="حجز مؤكد"
                                        onOpenBookings={() => router.push('/bookings')}
                                        onMessageOwner={() => void handleMessageOwner()}
                                    />
                                ) : pendingBooking ? (
                                    <BookingStateCard
                                        title="طلبك قيد المراجعة"
                                        subtitle={bookingSummary}
                                        badgeClassName="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                        badgeLabel="بانتظار موافقة المالك"
                                        onOpenBookings={() => router.push('/bookings')}
                                        onMessageOwner={() => void handleMessageOwner()}
                                    />
                                ) : canAccessBooking ? (
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={() => void handleMessageOwner()}
                                            className="min-h-12 rounded-2xl border border-gray-300 px-4 py-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                                        >
                                            مراسلة المالك
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleBookingClick}
                                            className="flex-1 min-h-12 rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/25 transition-all active:scale-95 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined">calendar_today</span>
                                                <span>حجز الآن</span>
                                            </span>
                                        </button>
                                    </div>
                                ) : pendingUnlockRequest ? (
                                    <div className="rounded-3xl border border-amber-200 bg-white p-4 shadow-lg dark:border-amber-900 dark:bg-zinc-950">
                                        <div className="flex items-start gap-3">
                                            <span className="material-symbols-outlined rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
                                                pending_actions
                                            </span>
                                            <div>
                                                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                                                    طلب فك القفل قيد المراجعة
                                                </p>
                                                <p className="mt-1 text-sm text-gray-600 dark:text-zinc-300">
                                                    تم تسجيل دفع رسوم فك القفل لهذا العقار. سيظهر زر الحجز بعد مراجعة الطلب
                                                    والموافقة عليه.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {nextPublicPeriod ? (
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                                                أقرب فترة غير متاحة: من {formatDate(nextPublicPeriod.startDate)} إلى{' '}
                                                {formatDate(nextPublicPeriod.endDate)}
                                            </div>
                                        ) : null}

                                        <button
                                            type="button"
                                            onClick={handleUnlockClick}
                                            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/25 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/50"
                                        >
                                            <span className="material-symbols-outlined">lock_open</span>
                                            <span>فك قفل الحجز لهذا العقار (50 ج.م)</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showUnlockModal ? (
                <UnlockModal
                    propertyId={initialProperty.id}
                    onClose={() => setShowUnlockModal(false)}
                    onSuccess={() => {
                        setShowUnlockModal(false);
                        if (user) {
                            void supabaseService.getTenantPropertyState(user.id, initialProperty.id).then((nextState) => {
                                setTenantState(nextState);
                            });
                        }
                    }}
                />
            ) : null}
        </main>
    );
}
