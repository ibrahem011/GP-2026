'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MyPropertyCard from '@/components/MyPropertyCard';
import EmptyState from '@/components/EmptyState';
import ProtectedRoute from '@/components/ProtectedRoute';
import MyPropertiesFilterSortSheet from '@/components/my-properties/MyPropertiesFilterSortSheet';
import MyPropertiesMobileActions from '@/components/my-properties/MyPropertiesMobileActions';
import MyPropertiesStatsPanel, {
    type MyPropertiesSummaryStats,
} from '@/components/my-properties/MyPropertiesStatsPanel';
import MyPropertiesStatsSheet from '@/components/my-properties/MyPropertiesStatsSheet';
import MyPropertyCardSkeleton from '@/components/my-properties/MyPropertyCardSkeleton';
import { useAuth } from '@/context/AuthContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { type FilterOption, usePropertyFilters } from '@/hooks/usePropertyFilters';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useRuntimeStatus } from '@/hooks/useRuntimeStatus';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { CATEGORY_AR, type PropertyStatus } from '@/types';

type DeleteState = {
    id: string;
    title: string;
} | null;

const statusBadgeStyles = {
    offline: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    mock: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
} as const;

export default function MyPropertiesPage() {
    const router = useRouter();
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const {
        properties,
        loading,
        error,
        deleteProperty,
        updateStatus,
        refresh,
        deletingId,
    } = useMyProperties(user?.id, {
        onSuccess: (message) => toast.success(message),
        onError: (message) => toast.error(message),
    });
    const {
        filter,
        setFilter,
        sortBy,
        setSortBy,
        filteredProperties: displayedProperties,
        availableCount,
        rentedCount,
        totalViews,
        uniqueCategories,
        isFilterEmpty,
    } = usePropertyFilters(properties);
    const { isOnline, isMockMode } = useRuntimeStatus();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isStatsSheetOpen, setIsStatsSheetOpen] = useState(false);
    const [propertyToDelete, setPropertyToDelete] = useState<DeleteState>(null);
    const filterButtonRef = useRef<HTMLButtonElement | null>(null);
    const statsButtonRef = useRef<HTMLButtonElement | null>(null);

    const summaryStats = useMemo<MyPropertiesSummaryStats>(
        () => ({
            total: properties.length,
            available: availableCount,
            rented: rentedCount,
            totalViews,
        }),
        [availableCount, properties.length, rentedCount, totalViews],
    );

    const runtimeBadges = useMemo(() => {
        const badges: Array<{ key: 'offline' | 'mock'; icon: string; label: string }> = [];

        if (!isOnline) {
            badges.push({ key: 'offline', icon: 'wifi_off', label: 'غير متصل' });
        }

        if (isMockMode) {
            badges.push({ key: 'mock', icon: 'science', label: 'Mock' });
        }

        return badges;
    }, [isMockMode, isOnline]);

    const activeControlsCount = useMemo(() => {
        let count = 0;
        if (sortBy !== 'newest') count += 1;
        if (filter !== null) count += 1;
        return count;
    }, [filter, sortBy]);

    const handleDeleteClick = useCallback(
        (id: string) => {
            const property = properties.find((item) => item.id === id);
            if (!property) {
                return;
            }

            setPropertyToDelete({ id, title: property.title });
        },
        [properties],
    );

    const handleConfirmDelete = async () => {
        if (!propertyToDelete) {
            return;
        }

        await deleteProperty(propertyToDelete.id);
        setPropertyToDelete(null);
    };

    const handleStatusChange = useCallback(
        async (id: string, newStatus: PropertyStatus) => {
            await updateStatus(id, newStatus);
        },
        [updateStatus],
    );

    const resetControls = () => {
        setFilter(null);
        setSortBy('newest');
    };

    const appliedFilterLabel = useMemo(() => {
        if (!filter) {
            return 'بدون تصفية مخصصة';
        }

        if (filter === 'available') {
            return 'المعروض الآن';
        }

        if (filter === 'rented') {
            return 'المؤجر حالياً';
        }

        return CATEGORY_AR[filter];
    }, [filter]);

    const desktopCardLayout = viewMode === 'grid' ? 'grid' : 'list';
    const cardLayout = isDesktop ? desktopCardLayout : 'mobile';

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24 pt-0 dark:bg-black">
                <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg shadow-slate-200/60 dark:bg-white/5 dark:shadow-none">
                        <span className="material-symbols-outlined text-5xl text-primary">
                            home_work
                        </span>
                    </div>

                    <h1 className="mb-3 text-3xl font-black text-gray-900 dark:text-white">
                        سجّل الدخول أولاً
                    </h1>
                    <p className="mb-8 max-w-md text-sm leading-7 text-gray-500 dark:text-gray-400">
                        لتصل إلى صفحة إدارة عقاراتك وتتابع حالتها وتعدّلها بسهولة من أي جهاز.
                    </p>

                    <Link
                        href="/auth"
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                    >
                        تسجيل الدخول
                        <span className="material-symbols-outlined text-[18px] rtl:rotate-180">
                            arrow_forward
                        </span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f3f5fb_100%)] pb-[calc(env(safe-area-inset-bottom)+8.5rem)] dark:bg-black md:pb-12">
                <div
                    className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/80 md:hidden"
                    data-testid="my-properties-mobile-header"
                >
                    <div className="mx-auto max-w-7xl px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                aria-label="الرجوع"
                                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition-colors active:bg-slate-100 dark:text-slate-200 dark:active:bg-white/10"
                            >
                                <span className="material-symbols-outlined text-[26px]">
                                    arrow_forward
                                </span>
                            </button>

                            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                                <span className="font-black text-slate-950 dark:text-white">
                                    عقاراتي
                                </span>
                                <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                                    {properties.length.toLocaleString('ar-EG')}
                                </span>
                            </div>

                            <Link
                                href="/add-property"
                                aria-label="إضافة عقار"
                                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                            >
                                <span className="material-symbols-outlined text-[22px]">
                                    add
                                </span>
                            </Link>
                        </div>

                        {runtimeBadges.length > 0 ? (
                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                                {runtimeBadges.map((badge) => (
                                    <span
                                        key={badge.key}
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold',
                                            statusBadgeStyles[badge.key],
                                        )}
                                    >
                                        <span className="material-symbols-outlined text-[15px]">
                                            {badge.icon}
                                        </span>
                                        {badge.label}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div
                    className="hidden px-4 pt-4 md:block"
                    data-testid="my-properties-desktop-hero"
                >
                    <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-dark/80">
                        <div className="flex flex-col gap-4 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-black text-primary">
                                        <span>{properties.length.toLocaleString('ar-EG')}</span>
                                        <span>عقار تحت إدارتك</span>
                                    </div>

                                    <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                                        لوحة عقاراتي
                                    </h1>
                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">
                                        متابعة أوضح لعقاراتك من مكان واحد، مع أدوات أسرع للتصفية
                                        والتعديل وتبديل العرض بين شبكة مرئية وقائمة عملية.
                                    </p>

                                    {runtimeBadges.length > 0 ? (
                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            {runtimeBadges.map((badge) => (
                                                <span
                                                    key={badge.key}
                                                    className={cn(
                                                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold',
                                                        statusBadgeStyles[badge.key],
                                                    )}
                                                >
                                                    <span className="material-symbols-outlined text-[15px]">
                                                        {badge.icon}
                                                    </span>
                                                    {badge.label}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        aria-label="الرجوع"
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-all hover:border-primary/20 hover:text-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            arrow_forward
                                        </span>
                                    </button>
                                    <Link
                                        href="/add-property"
                                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                                    >
                                        إضافة عقار
                                        <span className="material-symbols-outlined text-[18px]">
                                            add_circle
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                                    <span className="material-symbols-outlined text-[16px] text-primary">
                                        inventory_2
                                    </span>
                                    عرض {displayedProperties.length.toLocaleString('ar-EG')} من أصل{' '}
                                    {properties.length.toLocaleString('ar-EG')}
                                </div>

                                <div
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold',
                                        activeControlsCount > 0
                                            ? 'border-primary/20 bg-primary/10 text-primary'
                                            : 'border-slate-200/80 bg-white/85 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300',
                                    )}
                                >
                                    <span className="material-symbols-outlined text-[16px]">
                                        {activeControlsCount > 0 ? 'tune' : 'check_circle'}
                                    </span>
                                    {activeControlsCount > 0
                                        ? `${activeControlsCount.toLocaleString('ar-EG')} إعدادات نشطة`
                                        : 'بدون تخصيصات إضافية'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4">
                    {loading ? (
                        <>
                            <div className="mt-6 space-y-4 md:hidden" data-testid="my-properties-mobile-loading">
                                {[1, 2, 3].map((item) => (
                                    <MyPropertyCardSkeleton key={item} layout="mobile" />
                                ))}
                            </div>
                            <div
                                className="mt-6 hidden grid-cols-2 gap-5 md:grid lg:grid-cols-3 xl:grid-cols-4"
                                data-testid="my-properties-desktop-loading"
                            >
                                {[1, 2, 3, 4].map((item) => (
                                    <MyPropertyCardSkeleton key={item} layout="grid" />
                                ))}
                            </div>
                        </>
                    ) : error ? (
                        <div className="mt-6 rounded-[2rem] border border-red-200 bg-red-50/90 p-10 text-center shadow-sm dark:border-red-500/20 dark:bg-red-500/10">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
                                <span className="material-symbols-outlined text-3xl text-red-500">
                                    cloud_off
                                </span>
                            </div>
                            <p className="font-bold text-red-600 dark:text-red-300">
                                تعذّر تحميل العقارات
                            </p>
                            <p className="mt-2 text-sm text-red-500 dark:text-red-200">{error}</p>
                            <button
                                type="button"
                                onClick={refresh}
                                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-red-600"
                            >
                                إعادة المحاولة
                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                            </button>
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="mt-6">
                            <EmptyState
                                icon="home_work"
                                title="لا توجد عقارات مضافة"
                                subtitle="ابدأ بإضافة أول عقار لك حتى تظهر هنا لوحة إدارة أوضح وأسهل متابعة."
                                action={{ label: 'إضافة عقار جديد', href: '/add-property' }}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="mt-6 hidden md:block">
                                <MyPropertiesStatsPanel stats={summaryStats} />
                            </div>

                            <div className="mt-4 hidden rounded-[1.8rem] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] md:block">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                            إدارة العقارات
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                                            {appliedFilterLabel} مع ترتيب{' '}
                                            {sortBy === 'newest'
                                                ? 'الأحدث أولاً'
                                                : sortBy === 'oldest'
                                                  ? 'الأقدم أولاً'
                                                  : sortBy === 'views'
                                                    ? 'الأكثر مشاهدة'
                                                    : sortBy === 'price_high'
                                                      ? 'السعر من الأعلى'
                                                      : 'السعر من الأقل'}
                                            .
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100">
                                            <span className="material-symbols-outlined text-[18px] text-primary">
                                                sort
                                            </span>
                                            <span>الترتيب</span>
                                            <select
                                                aria-label="ترتيب العقارات"
                                                value={sortBy}
                                                onChange={(event) =>
                                                    setSortBy(
                                                        event.target.value as typeof sortBy,
                                                    )
                                                }
                                                className="bg-transparent text-sm font-bold text-slate-700 outline-none dark:text-slate-100"
                                            >
                                                <option value="newest">الأحدث أولاً</option>
                                                <option value="oldest">الأقدم أولاً</option>
                                                <option value="views">الأكثر مشاهدة</option>
                                                <option value="price_high">السعر من الأعلى</option>
                                                <option value="price_low">السعر من الأقل</option>
                                            </select>
                                        </label>

                                        <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.04]">
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('grid')}
                                                aria-label="عرض الشبكة"
                                                className={cn(
                                                    'flex h-9 w-10 items-center justify-center rounded-xl transition-all',
                                                    viewMode === 'grid'
                                                        ? 'bg-primary text-white shadow-sm'
                                                        : 'text-slate-500 hover:text-primary dark:text-slate-300',
                                                )}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    grid_view
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('list')}
                                                aria-label="عرض القائمة"
                                                className={cn(
                                                    'flex h-9 w-10 items-center justify-center rounded-xl transition-all',
                                                    viewMode === 'list'
                                                        ? 'bg-primary text-white shadow-sm'
                                                        : 'text-slate-500 hover:text-primary dark:text-slate-300',
                                                )}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    view_list
                                                </span>
                                            </button>
                                        </div>

                                        {activeControlsCount > 0 ? (
                                            <button
                                                type="button"
                                                onClick={resetControls}
                                                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition-all hover:border-primary/20 hover:text-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    restart_alt
                                                </span>
                                                إعادة التصفية
                                            </button>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFilter(null)}
                                        className={cn(
                                            'rounded-full border px-4 py-2 text-sm font-bold transition-all',
                                            filter === null
                                                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black'
                                                : 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
                                        )}
                                    >
                                        الكل
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilter('available')}
                                        className={cn(
                                            'rounded-full border px-4 py-2 text-sm font-bold transition-all',
                                            filter === 'available'
                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                : 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
                                        )}
                                    >
                                        متاح ({availableCount.toLocaleString('ar-EG')})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilter('rented')}
                                        className={cn(
                                            'rounded-full border px-4 py-2 text-sm font-bold transition-all',
                                            filter === 'rented'
                                                ? 'border-sky-500 bg-sky-500 text-white'
                                                : 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
                                        )}
                                    >
                                        مؤجر ({rentedCount.toLocaleString('ar-EG')})
                                    </button>
                                    {uniqueCategories.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setFilter(category as FilterOption)}
                                            className={cn(
                                                'rounded-full border px-4 py-2 text-sm font-bold transition-all',
                                                filter === category
                                                    ? 'border-primary bg-primary text-white'
                                                    : 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
                                            )}
                                        >
                                            {CATEGORY_AR[category]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isFilterEmpty ? (
                                <div className="mt-6">
                                    <EmptyState
                                        icon="filter_list_off"
                                        title="لا توجد نتائج بهذه التصفية"
                                        subtitle="جرّب إزالة الفلتر الحالي أو تغيير الترتيب حتى تعود العقارات للظهور."
                                        action={{ label: 'إلغاء التصفية', onClick: resetControls }}
                                    />
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        'mt-6',
                                        cardLayout === 'grid'
                                            ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                            : 'space-y-4',
                                    )}
                                >
                                    {displayedProperties.map((property) => (
                                        <div key={property.id} className="animate-fadeIn">
                                            <MyPropertyCard
                                                property={property}
                                                layout={cardLayout}
                                                onDelete={handleDeleteClick}
                                                onStatusChange={handleStatusChange}
                                                isDeleting={deletingId === property.id}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!loading && !error && properties.length > 0 ? (
                    <>
                        <MyPropertiesMobileActions
                            onOpenFilters={() => setIsFilterSheetOpen(true)}
                            onOpenStats={() => setIsStatsSheetOpen(true)}
                            activeCount={activeControlsCount}
                            resultsCount={displayedProperties.length}
                            totalCount={properties.length}
                            filterButtonRef={filterButtonRef}
                            statsButtonRef={statsButtonRef}
                        />

                        <MyPropertiesFilterSortSheet
                            open={isFilterSheetOpen}
                            onClose={() => setIsFilterSheetOpen(false)}
                            sortBy={sortBy}
                            filter={filter}
                            properties={properties}
                            availableCount={availableCount}
                            rentedCount={rentedCount}
                            uniqueCategories={uniqueCategories}
                            onApply={({ sortBy: nextSort, filter: nextFilter }) => {
                                setSortBy(nextSort);
                                setFilter(nextFilter);
                            }}
                            returnFocusRef={filterButtonRef}
                        />

                        <MyPropertiesStatsSheet
                            open={isStatsSheetOpen}
                            onClose={() => setIsStatsSheetOpen(false)}
                            stats={summaryStats}
                            returnFocusRef={statsButtonRef}
                        />
                    </>
                ) : null}

                {propertyToDelete ? (
                    <div
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md sm:items-center sm:p-4"
                        onClick={() => setPropertyToDelete(null)}
                    >
                        <div
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="my-properties-delete-title"
                            aria-describedby="my-properties-delete-description"
                            className="w-full max-w-sm rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] dark:bg-zinc-900"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-zinc-800 sm:hidden" />

                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
                                <span className="material-symbols-outlined text-4xl">warning</span>
                            </div>

                            <h3
                                id="my-properties-delete-title"
                                className="text-center text-xl font-black text-gray-900 dark:text-white"
                            >
                                تأكيد الحذف
                            </h3>
                            <p
                                id="my-properties-delete-description"
                                className="mt-2 text-center text-sm leading-7 text-gray-500 dark:text-gray-400"
                            >
                                سيتم حذف العقار نهائياً من قائمتك. تأكد أنك تريد المتابعة.
                            </p>
                            <p className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-center font-bold text-gray-900 dark:bg-white/[0.05] dark:text-white">
                                "{propertyToDelete.title}"
                            </p>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPropertyToDelete(null)}
                                    className="flex-1 rounded-2xl bg-gray-100 py-3.5 font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/10"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleConfirmDelete()}
                                    disabled={deletingId === propertyToDelete.id}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-3.5 font-bold text-white transition-all hover:bg-red-600 disabled:opacity-60"
                                >
                                    {deletingId === propertyToDelete.id ? (
                                        <span
                                            aria-hidden="true"
                                            className="material-symbols-outlined animate-spin text-[20px]"
                                        >
                                            progress_activity
                                        </span>
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="material-symbols-outlined text-[20px]"
                                        >
                                            delete_sweep
                                        </span>
                                    )}
                                    {deletingId === propertyToDelete.id
                                        ? 'جارٍ الحذف...'
                                        : 'نعم، احذف'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="h-8 md:hidden" />
            </div>
        </ProtectedRoute>
    );
}
