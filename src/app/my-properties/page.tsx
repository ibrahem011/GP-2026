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
import { CATEGORY_AR, STATUS_AR, type PropertyCategory, type PropertyStatus } from '@/types';

type DeleteState = {
    id: string;
    title: string;
} | null;

const statusBadgeStyles = {
    offline: 'border-amber-200/70 bg-amber-50/70 text-amber-700/90 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    mock: 'border-sky-200/70 bg-sky-50/70 text-sky-700/90 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
} as const;

function isPropertyCategoryFilter(filter: FilterOption): filter is PropertyCategory {
    return filter !== null && filter in CATEGORY_AR;
}

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

        if (isPropertyCategoryFilter(filter)) {
            return CATEGORY_AR[filter];
        }

        return STATUS_AR[filter];
    }, [filter]);

    const desktopCardLayout = viewMode === 'grid' ? 'grid' : 'list';
    const cardLayout = isDesktop ? desktopCardLayout : 'mobile';

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-background-light pb-24 pt-0 dark:bg-background-dark">
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
            <div className="min-h-screen bg-[#f6f7fb] pb-[calc(env(safe-area-inset-bottom)+8.5rem)] dark:bg-[#121520] md:pb-12">
                <div
                    className="border-b border-slate-200/70 bg-[#f6f7fb] dark:border-[#2a3142] dark:bg-[#121520] md:hidden"
                    data-testid="my-properties-mobile-header"
                >
                    <div className="mx-auto max-w-7xl px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                aria-label="الرجوع"
                                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#4e5f97] transition-colors hover:text-primary dark:border-[#2a3142] dark:bg-[#1e2130] dark:text-slate-300 dark:hover:text-white"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    arrow_forward
                                </span>
                            </button>

                            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                                <span className="text-xl font-black text-[#0e111b] dark:text-white">
                                    عقاراتي
                                </span>
                                <span className="inline-flex min-w-[32px] items-center justify-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                                    {properties.length.toLocaleString('ar-EG')}
                                </span>
                            </div>

                            <div aria-hidden="true" className="min-h-[44px] min-w-[44px] shrink-0" />
                        </div>
                    </div>
                </div>

                <div
                    className="hidden px-4 pt-6 md:block"
                    data-testid="my-properties-desktop-hero"
                >
                    <div className="mx-auto max-w-7xl rounded-[24px] border border-slate-200/70 bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:border-[#2a3142] dark:bg-[#1e2130]">
                        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    aria-label="الرجوع"
                                    className="mt-1 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#4e5f97] transition-all hover:border-primary/30 hover:text-primary dark:border-[#2a3142] dark:bg-[#1e2130] dark:text-slate-300 dark:hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        arrow_forward
                                    </span>
                                </button>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-3xl font-black tracking-tight text-[#0e111b] dark:text-white">
                                        عقاراتي
                                    </h1>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4e5f97] dark:text-slate-400">
                                        أدر عقاراتك بسهولة وتابع حالات النشر والإحصائيات من مكان واحد.
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-3">
                                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-[#4e5f97] dark:border-[#2a3142] dark:bg-[#121520] dark:text-slate-300">
                                            <span className="material-symbols-outlined text-[18px] text-primary">
                                                inventory_2
                                            </span>
                                            عرض {displayedProperties.length.toLocaleString('ar-EG')} من أصل{' '}
                                            {properties.length.toLocaleString('ar-EG')}
                                        </div>

                                        <div
                                            className={cn(
                                                'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors',
                                                activeControlsCount > 0
                                                    ? 'border-primary/20 bg-primary/10 text-primary'
                                                    : 'border-slate-200 bg-slate-50 text-[#4e5f97] dark:border-[#2a3142] dark:bg-[#121520] dark:text-slate-300',
                                            )}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
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
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4">
                    {runtimeBadges.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2 md:mt-4">
                            {runtimeBadges.map((badge) => (
                                <span
                                    key={badge.key}
                                    className={cn(
                                        'inline-flex min-h-[28px] items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold',
                                        statusBadgeStyles[badge.key],
                                    )}
                                >
                                    <span className="material-symbols-outlined text-[16px]">
                                        {badge.icon}
                                    </span>
                                    {badge.label}
                                </span>
                            ))}
                        </div>
                    ) : null}

                    {loading ? (
                        <>
                            <div className="mt-6 space-y-4 md:hidden" data-testid="my-properties-mobile-loading">
                                {[1, 2, 3].map((item) => (
                                    <MyPropertyCardSkeleton key={item} layout="mobile" />
                                ))}
                            </div>
                            <div
                                className="mt-6 hidden grid-cols-2 gap-5 md:grid lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
                                data-testid="my-properties-desktop-loading"
                            >
                                {[1, 2, 3, 4].map((item) => (
                                    <MyPropertyCardSkeleton key={item} layout="grid" />
                                ))}
                            </div>
                        </>
                    ) : error ? (
                        <div className="mt-8 flex flex-col items-center justify-center rounded-[24px] border border-red-200/60 bg-red-50/50 py-16 text-center dark:border-red-900/30 dark:bg-red-500/5">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                                <span className="material-symbols-outlined text-3xl text-red-500">
                                    cloud_off
                                </span>
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-[#0e111b] dark:text-white">تعذّر تحميل العقارات</h3>
                            <p className="max-w-xs text-sm leading-relaxed text-[#4e5f97] dark:text-slate-400">{error}</p>
                            <button
                                type="button"
                                onClick={refresh}
                                className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-red-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-600"
                            >
                                إعادة المحاولة
                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                            </button>
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="mt-8">
                            <EmptyState
                                icon="home_work"
                                title="لا توجد عقارات مضافة"
                                subtitle="ابدأ بإضافة أول عقار لك حتى تظهر هنا."
                                action={{ label: 'إضافة عقار جديد', href: '/add-property' }}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="mt-6 hidden rounded-[24px] border border-slate-200/70 bg-white p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:border-[#2a3142] dark:bg-[#1e2130] md:block">
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                        <div>
                                            <h2 className="text-xl font-black text-[#0e111b] dark:text-white">
                                                إدارة العقارات
                                            </h2>
                                            <p className="mt-1 text-sm text-[#4e5f97] dark:text-slate-400">
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
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0e111b] dark:border-[#2a3142] dark:bg-[#121520] dark:text-white">
                                                <span className="material-symbols-outlined text-[18px] text-primary">
                                                    sort
                                                </span>
                                                <span className="text-[#4e5f97] dark:text-slate-400">الترتيب</span>
                                                <select
                                                    aria-label="ترتيب العقارات"
                                                    value={sortBy}
                                                    onChange={(event) =>
                                                        setSortBy(
                                                            event.target.value as typeof sortBy,
                                                        )
                                                    }
                                                    className="bg-transparent text-sm font-bold text-[#0e111b] outline-none dark:text-white"
                                                >
                                                    <option value="newest">الأحدث أولاً</option>
                                                    <option value="oldest">الأقدم أولاً</option>
                                                    <option value="views">الأكثر مشاهدة</option>
                                                    <option value="price_high">السعر من الأعلى</option>
                                                    <option value="price_low">السعر من الأقل</option>
                                                </select>
                                            </label>

                                            <div className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-[#2a3142] dark:bg-[#121520]">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewMode('grid')}
                                                    aria-label="عرض الشبكة"
                                                    className={cn(
                                                        'flex min-h-[36px] min-w-[40px] items-center justify-center rounded-lg transition-all',
                                                        viewMode === 'grid'
                                                            ? 'bg-white text-[#0e111b] shadow-sm dark:bg-[#2a3142] dark:text-white'
                                                            : 'text-[#4e5f97] hover:text-[#0e111b] dark:text-slate-400 dark:hover:text-white',
                                                    )}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        grid_view
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setViewMode('list')}
                                                    aria-label="عرض القائمة"
                                                    className={cn(
                                                        'flex min-h-[36px] min-w-[40px] items-center justify-center rounded-lg transition-all',
                                                        viewMode === 'list'
                                                            ? 'bg-white text-[#0e111b] shadow-sm dark:bg-[#2a3142] dark:text-white'
                                                            : 'text-[#4e5f97] hover:text-[#0e111b] dark:text-slate-400 dark:hover:text-white',
                                                    )}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        view_list
                                                    </span>
                                                </button>
                                            </div>

                                            {activeControlsCount > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={resetControls}
                                                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#4e5f97] transition-all hover:border-primary/20 hover:text-primary dark:border-[#2a3142] dark:bg-[#121520] dark:text-slate-300"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        restart_alt
                                                    </span>
                                                    إعادة التصفية
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    <MyPropertiesStatsPanel stats={summaryStats} />

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFilter(null)}
                                            className={cn(
                                                'inline-flex min-h-[40px] items-center rounded-xl border px-5 py-2 text-sm font-bold transition-all',
                                                filter === null
                                                    ? 'border-[#0e111b] bg-[#0e111b] text-white dark:border-white dark:bg-white dark:text-black'
                                                    : 'border-slate-200 bg-white text-[#4e5f97] hover:border-[#0e111b] dark:border-[#2a3142] dark:bg-[#121520] dark:text-slate-300 dark:hover:border-white',
                                            )}
                                        >
                                            الكل
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFilter('available')}
                                            className={cn(
                                                'inline-flex min-h-[40px] items-center rounded-xl border px-5 py-2 text-sm font-bold transition-all',
                                                filter === 'available'
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : 'border-slate-200 bg-white text-[#4e5f97] hover:border-[#0e111b] dark:border-[#2a3142] dark:bg-[#121520] dark:text-slate-300 dark:hover:border-white',
                                            )}
                                        >
                                            متاح ({availableCount.toLocaleString('ar-EG')})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFilter('rented')}
                                            className={cn(
                                                'inline-flex min-h-[40px] items-center rounded-xl border px-5 py-2 text-sm font-bold transition-all',
                                                filter === 'rented'
                                                    ? 'border-sky-500 bg-sky-500 text-white'
                                                    : 'border-slate-200 bg-white text-[#4e5f97] hover:border-[#0e111b] dark:border-[#2a3142] dark:bg-[#121520] dark:text-slate-300 dark:hover:border-white',
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
                                                    'inline-flex min-h-[40px] items-center rounded-xl border px-5 py-2 text-sm font-bold transition-all',
                                                    filter === category
                                                        ? 'border-primary bg-primary text-white'
                                                        : 'border-slate-200 bg-white text-[#4e5f97] hover:border-[#0e111b] dark:border-[#2a3142] dark:bg-[#121520] dark:text-slate-300 dark:hover:border-white',
                                                )}
                                            >
                                                {CATEGORY_AR[category]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {isFilterEmpty ? (
                                <div className="mt-8">
                                    <EmptyState
                                        icon="filter_list_off"
                                        title="لا توجد نتائج"
                                        subtitle="جرّب إزالة الفلتر الحالي أو تغيير الترتيب لعرض العقارات."
                                        action={{ label: 'إلغاء التصفية', onClick: resetControls }}
                                    />
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        'mt-6',
                                        cardLayout === 'grid'
                                            ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4'
                                            : 'space-y-4',
                                    )}
                                >
                                    {displayedProperties.map((property) => (
                                        <div key={property.id}>
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
                        className="fixed inset-0 z-50 flex items-end justify-center bg-[#0e111b]/60 backdrop-blur-sm sm:items-center sm:p-4"
                        onClick={() => setPropertyToDelete(null)}
                    >
                        <div
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="my-properties-delete-title"
                            aria-describedby="my-properties-delete-description"
                            className="w-full max-w-sm rounded-t-[24px] border border-transparent bg-white p-6 shadow-2xl sm:rounded-[24px] dark:border-[#2a3142] dark:bg-[#1e2130]"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-[#2a3142] sm:hidden" />

                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10">
                                <span className="material-symbols-outlined text-4xl">warning</span>
                            </div>

                            <h3
                                id="my-properties-delete-title"
                                className="text-center text-xl font-black text-[#0e111b] dark:text-white"
                            >
                                تأكيد الحذف
                            </h3>
                            <p
                                id="my-properties-delete-description"
                                className="mt-2 text-center text-sm leading-7 text-[#4e5f97] dark:text-slate-400"
                            >
                                تأكيد حذف العقار بشكل نهائي. لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
                            </p>
                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center font-bold text-[#0e111b] dark:border-[#2a3142] dark:bg-[#121520] dark:text-white">
                                &quot;{propertyToDelete.title}&quot;
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPropertyToDelete(null)}
                                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-slate-100 px-4 py-2 font-bold text-[#0e111b] transition-colors hover:bg-slate-200 dark:bg-[#2a3142] dark:text-white dark:hover:bg-[#343b4f]"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="button"
                                    aria-label="نعم، احذف"
                                    onClick={() => void handleConfirmDelete()}
                                    disabled={deletingId === propertyToDelete.id}
                                    className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 font-bold text-white transition-all hover:bg-red-600 disabled:opacity-60"
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
                                        : 'حذف العقار'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Desktop Floating Add Button */}
                <div className="hidden md:block fixed bottom-8 left-8 z-50 rtl:left-auto rtl:right-8">
                    <Link
                        href="/add-property"
                        aria-label="إضافة عقار"
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_30px_-4px_rgba(37,99,235,0.4)] transition-transform hover:scale-105 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-4xl">add</span>
                    </Link>
                </div>

                <div className="h-8 md:hidden" />
            </div>
        </ProtectedRoute>
    );
}
