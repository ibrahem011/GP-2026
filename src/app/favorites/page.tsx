'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PropertyCard } from '@/components/PropertyCard';
import FavoritesFilterSortSheet, {
    DEFAULT_FAVORITES_FILTERS,
    type FavoritesFilters,
    type FavoritesSort,
} from '@/components/favorites/FavoritesFilterSortSheet';
import FavoritesMobileActions from '@/components/favorites/FavoritesMobileActions';
import FavoritesStatsPanel, {
    type FavoritesSummaryStats,
} from '@/components/favorites/FavoritesStatsPanel';
import FavoritesStatsSheet from '@/components/favorites/FavoritesStatsSheet';
import { useAuth } from '@/context/AuthContext';
import { fromPropertyRow } from '@/lib/propertyMapper';
import { cn } from '@/lib/utils';
import { supabaseService } from '@/services/supabaseService';
import { type Property } from '@/types';

function countActiveControls(sortBy: FavoritesSort, filters: FavoritesFilters) {
    let count = 0;

    if (sortBy !== 'newest') count += 1;
    if (filters.category !== 'all') count += 1;
    if (filters.minPrice.trim()) count += 1;
    if (filters.maxPrice.trim()) count += 1;
    if (filters.selectedFeatures.length > 0) count += 1;

    return count;
}

export default function FavoritesPage() {
    const router = useRouter();
    const [favorites, setFavorites] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTimeout, setIsTimeout] = useState(false);
    const [sortBy, setSortBy] = useState<FavoritesSort>('newest');
    const [filters, setFilters] = useState<FavoritesFilters>(DEFAULT_FAVORITES_FILTERS);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isStatsSheetOpen, setIsStatsSheetOpen] = useState(false);
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const timeoutMessage = 'انتهت مهلة تحميل المفضلات. تأكد من الاتصال ثم حاول مرة أخرى.';
    const genericErrorMessage = 'فشل جلب المفضلات. يرجى المحاولة مرة أخرى.';

    useEffect(() => {
        if (!authLoading && user) {
            void fetchFavorites();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [authLoading, user]);

    const fetchFavorites = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        setIsTimeout(false);

        try {
            const { data, error: fetchError, isTimeout: timedOut } = await supabaseService.getFavorites(user.id, {
                timeoutMs: 8_000,
                maxRetries: 1,
            });

            if (timedOut) {
                setIsTimeout(true);
                setError(timeoutMessage);
                setFavorites([]);
                return;
            }

            if (fetchError) {
                setError(genericErrorMessage);
                setFavorites([]);
                return;
            }

            setFavorites((data ?? []).map(fromPropertyRow));
        } catch (err) {
            console.error('[FavoritesPage Unexpected Error]', err);
            setIsTimeout(false);
            setError(genericErrorMessage);
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredFavorites = useMemo(() => {
        const min = filters.minPrice.trim() === '' ? null : Number(filters.minPrice);
        const max = filters.maxPrice.trim() === '' ? null : Number(filters.maxPrice);

        const nextFavorites = favorites.filter((property) => {
            if (filters.category !== 'all' && property.category !== filters.category) {
                return false;
            }

            if (Number.isFinite(min) && min !== null && property.price < min) {
                return false;
            }

            if (Number.isFinite(max) && max !== null && property.price > max) {
                return false;
            }

            if (
                filters.selectedFeatures.length > 0 &&
                !filters.selectedFeatures.every((featureId) => property.features.includes(featureId))
            ) {
                return false;
            }

            return true;
        });

        nextFavorites.sort((a, b) => {
            if (sortBy === 'price_desc') return b.price - a.price;
            if (sortBy === 'price_asc') return a.price - b.price;
            if (sortBy === 'area_desc') return b.area - a.area;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return nextFavorites;
    }, [favorites, filters, sortBy]);

    const summaryStats = useMemo<FavoritesSummaryStats>(() => {
        const verifiedCount = favorites.filter((property) => property.isVerified).length;
        const averagePrice = favorites.length
            ? Math.round(favorites.reduce((total, property) => total + property.price, 0) / favorites.length)
            : 0;
        const largestArea = favorites.reduce((largest, property) => Math.max(largest, property.area), 0);

        return {
            total: favorites.length,
            verifiedCount,
            averagePrice,
            largestArea,
        };
    }, [favorites]);

    const activeControlsCount = useMemo(
        () => countActiveControls(sortBy, filters),
        [filters, sortBy],
    );

    const hasActiveControls = activeControlsCount > 0;

    const resetControls = () => {
        setSortBy('newest');
        setFilters(DEFAULT_FAVORITES_FILTERS);
    };

    const handleFavoriteChange = (property: Property, nextState: boolean) => {
        if (!nextState) {
            setFavorites((current) => current.filter((item) => item.id !== property.id));
            return;
        }

        setFavorites((current) => {
            if (current.some((item) => item.id === property.id)) {
                return current;
            }

            return [property, ...current];
        });
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 pb-24 pt-0 dark:bg-black md:pt-[104px]">
                <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg shadow-slate-200/60 dark:bg-white/5 dark:shadow-none">
                        <span className="material-symbols-outlined text-5xl text-primary">favorite</span>
                    </div>

                    <h1 className="mb-3 text-3xl font-black text-gray-900 dark:text-white">
                        سجّل الدخول أولاً
                    </h1>
                    <p className="mb-8 max-w-md text-sm leading-7 text-gray-500 dark:text-gray-400">
                        للوصول إلى قائمة المفضلة الخاصة بك، سجّل الدخول حتى نعرض لك العقارات التي
                        حفظتها ونساعدك على الرجوع إليها بسرعة.
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
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#f3f5fb_100%)] pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-0 dark:bg-black md:pb-12 md:pt-[104px]">
            <div
                className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/80 md:hidden"
                data-testid="favorites-mobile-header"
            >
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        aria-label="الرجوع"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors active:bg-slate-100 dark:text-slate-200 dark:active:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-[26px]">arrow_forward</span>
                    </button>
                    <span className="font-black text-slate-950 dark:text-white">المفضلة</span>
                    <div className="h-10 w-10" aria-hidden="true" />
                </div>
            </div>

            <div
                className="hidden px-4 md:sticky md:top-[92px] md:z-30 md:block"
                data-testid="favorites-desktop-hero"
            >
                <div className="mx-auto mt-4 max-w-7xl rounded-[1.9rem] border border-white/70 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-dark/80 md:mt-0">
                    <div className="flex flex-col gap-4 p-4 md:p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-black text-primary">
                                    <span>{summaryStats.total.toLocaleString('ar-EG')}</span>
                                    <span>عقار محفوظ</span>
                                </div>

                                <h1 className="mt-4 hidden text-3xl font-black tracking-tight text-slate-950 dark:text-white md:block md:text-4xl">
                                    المفضلة
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300 md:mt-2">
                                    صفحة أخف وأوضح ترجعك بسرعة لكل العقارات التي لفتت انتباهك، مع
                                    أدوات مركزة على الدسكتوب وهيدر ثابت وواضح على الموبايل.
                                </p>
                            </div>

                            <Link
                                href="/search"
                                className="hidden items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 md:inline-flex"
                            >
                                استكشف المزيد
                                <span className="material-symbols-outlined text-[18px] rtl:rotate-180">
                                    arrow_forward
                                </span>
                            </Link>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                                <span className="material-symbols-outlined text-[16px] text-primary">
                                    inventory_2
                                </span>
                                عرض {filteredFavorites.length.toLocaleString('ar-EG')} من أصل{' '}
                                {favorites.length.toLocaleString('ar-EG')}
                            </div>

                            <div
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold',
                                    hasActiveControls
                                        ? 'border-primary/20 bg-primary/10 text-primary'
                                        : 'border-slate-200/80 bg-white/85 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300',
                                )}
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    {hasActiveControls ? 'tune' : 'check_circle'}
                                </span>
                                {hasActiveControls
                                    ? `${activeControlsCount.toLocaleString('ar-EG')} إعدادات نشطة`
                                    : 'بدون تصفية مخصصة'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4">
                {loading ? (
                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-[360px] animate-pulse rounded-[2rem] border border-white/70 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="mt-6 rounded-[2rem] border border-red-200 bg-red-50/90 p-10 text-center shadow-sm dark:border-red-500/20 dark:bg-red-500/10">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
                            <span className="material-symbols-outlined text-3xl text-red-500">error</span>
                        </div>

                        <p className="font-bold text-red-600 dark:text-red-300">{error}</p>
                        {isTimeout ? (
                            <p className="mt-2 text-sm text-red-500 dark:text-red-200">
                                الصفحة متاحة، لكن الخادم تأخر في الاستجابة.
                            </p>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => void fetchFavorites()}
                            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-red-600"
                        >
                            إعادة المحاولة
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                        </button>
                    </div>
                ) : favorites.length > 0 ? (
                    <>
                        <div className="mt-6 hidden md:block">
                            <FavoritesStatsPanel stats={summaryStats} />
                        </div>

                        <div className="mt-4 hidden items-center justify-between gap-4 rounded-[1.8rem] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] md:flex">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                    العقارات المحفوظة
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                                    رتّب الصفحة بالطريقة الأنسب لك وبدّل بين التصفية بسرعة.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFilterSheetOpen(true)}
                                    aria-label="فتح فلترة وترتيب الدسكتوب"
                                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-all hover:border-primary/20 hover:text-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                                >
                                    <span className="material-symbols-outlined text-[18px]">tune</span>
                                    فلترة وترتيب
                                    {activeControlsCount > 0 ? (
                                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                                            {activeControlsCount}
                                        </span>
                                    ) : null}
                                </button>

                                <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100">
                                    <span className="material-symbols-outlined text-[18px] text-primary">
                                        sort
                                    </span>
                                    <span>الترتيب</span>
                                    <select
                                        aria-label="ترتيب المفضلة"
                                        value={sortBy}
                                        onChange={(event) =>
                                            setSortBy(event.target.value as FavoritesSort)
                                        }
                                        className="bg-transparent text-sm font-bold text-slate-700 outline-none dark:text-slate-100"
                                    >
                                        <option value="newest">الأحدث أولاً</option>
                                        <option value="price_desc">السعر من الأعلى إلى الأقل</option>
                                        <option value="price_asc">السعر من الأقل إلى الأعلى</option>
                                        <option value="area_desc">المساحة الأكبر أولاً</option>
                                    </select>
                                </label>

                                {hasActiveControls ? (
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

                        {filteredFavorites.length > 0 ? (
                            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredFavorites.map((property) => (
                                    <div key={property.id} className="animate-fadeIn">
                                        <PropertyCard
                                            {...property}
                                            image={property.images[0] || ''}
                                            location={property.location.address || property.location.area}
                                            variant="favorites"
                                            initialIsFavorite
                                            onFavoriteChange={(nextState) =>
                                                handleFavoriteChange(property, nextState)
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/75 p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined text-3xl">filter_alt_off</span>
                                </div>

                                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                    لا توجد نتائج بهذه التصفية
                                </h3>
                                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
                                    جرّب توسيع نطاق السعر أو إزالة بعض المميزات حتى تظهر لك نتائج
                                    أكثر.
                                </p>

                                <button
                                    type="button"
                                    onClick={resetControls}
                                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition-all hover:bg-primary/90"
                                >
                                    إلغاء التصفية
                                    <span className="material-symbols-outlined text-[18px]">
                                        restart_alt
                                    </span>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mt-6 rounded-[2.2rem] border-2 border-dashed border-slate-200 bg-white/75 p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-4xl">favorite</span>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                            لا توجد عقارات مفضلة
                        </h3>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
                            عندما تعثر على عقار يعجبك، اضغط على زر القلب ليظهر هنا لاحقاً مع
                            تجربة أكثر وضوحاً وسرعة.
                        </p>

                        <Link
                            href="/search"
                            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                        >
                            تصفح العقارات
                            <span className="material-symbols-outlined text-[18px] rtl:rotate-180">
                                arrow_forward
                            </span>
                        </Link>
                    </div>
                )}
            </div>

            {!loading && !error && favorites.length > 0 ? (
                <>
                    <FavoritesMobileActions
                        onOpenFilters={() => setIsFilterSheetOpen(true)}
                        onOpenStats={() => setIsStatsSheetOpen(true)}
                        activeCount={activeControlsCount}
                        resultsCount={filteredFavorites.length}
                        totalCount={favorites.length}
                    />

                    <FavoritesFilterSortSheet
                        open={isFilterSheetOpen}
                        onClose={() => setIsFilterSheetOpen(false)}
                        sortBy={sortBy}
                        filters={filters}
                        onApply={({ sortBy: nextSort, filters: nextFilters }) => {
                            setSortBy(nextSort);
                            setFilters(nextFilters);
                        }}
                    />

                    <FavoritesStatsSheet
                        open={isStatsSheetOpen}
                        onClose={() => setIsStatsSheetOpen(false)}
                        stats={summaryStats}
                    />
                </>
            ) : null}

            <div className="h-8 md:hidden" />
        </div>
    );
}
