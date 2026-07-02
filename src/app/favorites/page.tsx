'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PropertyCard } from '@/components/PropertyCard';
import FavoritesFilterSortSheet, {
    DEFAULT_FAVORITES_FILTERS,
    type FavoritesFilters,
    type FavoritesSort,
} from '@/components/favorites/FavoritesFilterSortSheet';
import FavoritesDesktopControls from '@/components/favorites/FavoritesDesktopControls';
import FavoritesMobileActions from '@/components/favorites/FavoritesMobileActions';
import FavoritesStatsSheet, {
    type FavoritesSummaryStats,
} from '@/components/favorites/FavoritesStatsSheet';
import { useAuth } from '@/context/AuthContext';
import { fromPropertyRow } from '@/lib/propertyMapper';

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user]);

    const fetchFavorites = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        setIsTimeout(false);

        try {
            const { data, error: fetchError, isTimeout: timedOut } = await supabaseService.getFavorites(user.id, {
                timeoutMs: 8_000,
                maxRetries: 0,
                retryOnTimeout: false,
                operationKey: 'favoritesPage',
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

    const handleFavoriteChange = useCallback((property: Property, nextState: boolean) => {
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
    }, []);

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#f6f7fb] pb-24 pt-0 dark:bg-[#121520] md:pt-[104px]">
                <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg shadow-slate-200/60 dark:bg-[#1e2130] dark:shadow-none">
                        <span className="material-symbols-outlined text-5xl text-primary">favorite</span>
                    </div>

                    <h1 className="mb-3 type-headline text-[#0e111b] dark:text-white">
                        سجّل الدخول أولاً
                    </h1>
                    <p className="mb-8 max-w-md type-body-medium text-[#4e5f97] dark:text-slate-400">
                        للوصول إلى قائمة المفضلة الخاصة بك، سجّل الدخول حتى نعرض لك العقارات التي
                        حفظتها ونساعدك على الرجوع إليها بسرعة.
                    </p>

                    <Link
                        href="/auth"
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
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
        <div className="min-h-screen bg-[#f6f7fb] pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-0 dark:bg-[#121520] md:pb-12 md:pt-0">
            <div
                className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f6f7fb] dark:border-[#2a3142] dark:bg-[#121520] md:hidden"
                data-testid="favorites-mobile-header"
            >
                <div className="mx-auto max-w-7xl px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            aria-label="الرجوع"
                            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#4e5f97] transition-colors hover:text-primary dark:border-[#2a3142] dark:bg-[#1e2130] dark:text-slate-300 dark:hover:text-white"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>

                        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                            <span className="type-title text-[#0e111b] dark:text-white">المفضلة</span>
                        </div>

                        <div aria-hidden="true" className="min-h-[44px] min-w-[44px] shrink-0" />
                    </div>
                </div>
            </div>

            <div
                className="hidden md:block"
                data-testid="favorites-desktop-hero"
            >
                <div className="mx-auto max-w-7xl px-4 py-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            aria-label="العودة إلى الرئيسية"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#4e5f97] transition-colors hover:text-primary dark:border-[#2a3142] dark:bg-[#1e2130] dark:text-slate-300 dark:hover:text-white"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate type-headline text-[#0e111b] dark:text-white">المفضلة</h1>
                            <p className="mt-1 truncate type-caption text-[#4e5f97] dark:text-slate-400">عقاراتك المحفوظة في مكان واحد.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4">
                {loading ? (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-[360px] animate-pulse rounded-[24px] border border-slate-200/70 bg-white/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:border-[#2a3142] dark:bg-[#1e2130]"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50/90 p-10 text-center shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:border-red-500/20 dark:bg-red-500/10">
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
                            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold text-white transition-all hover:bg-red-600"
                        >
                            إعادة المحاولة
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                        </button>
                    </div>
) : favorites.length > 0 ? (
                    <>
                        <div className="mx-auto max-w-7xl px-4 py-6 lg:max-w-[1280px]">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                                <div className="card-stat">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="type-label text-[#4e5f97] dark:text-slate-400">إجمالي المفضلة</div>
                                        <span className="material-symbols-outlined text-xl text-[#4e5f97] opacity-60 dark:text-slate-400">favorite</span>
                                    </div>
                                    <div className="mt-4 flex items-end justify-between gap-3">
                                        <span className="type-metric text-[#0e111b] dark:text-white">{summaryStats.total.toLocaleString('ar-EG')}</span>
                                    </div>
                                </div>

                                <div className="card-stat">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="type-label text-[#4e5f97] dark:text-slate-400">عقارات موثقة</div>
                                        <span className="material-symbols-outlined text-xl text-emerald-600 opacity-60 dark:text-emerald-400">verified</span>
                                    </div>
                                    <div className="mt-4 flex items-end justify-between gap-3">
                                        <span className="type-metric text-[#0e111b] dark:text-white">{summaryStats.verifiedCount.toLocaleString('ar-EG')}</span>
                                    </div>
                                </div>

                                <div className="card-stat">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="type-label text-[#4e5f97] dark:text-slate-400">متوسط السعر</div>
                                        <span className="material-symbols-outlined text-xl text-amber-600 opacity-60 dark:text-amber-400">payments</span>
                                    </div>
                                    <div className="mt-4 flex items-end justify-between gap-3">
                                        <span className="type-metric text-[#0e111b] dark:text-white">{summaryStats.averagePrice.toLocaleString('ar-EG')}</span>
                                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-[#4e5f97] dark:bg-[#121520] dark:text-slate-400">ج.م</span>
                                    </div>
                                </div>

                                <div className="card-stat">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="type-label text-[#4e5f97] dark:text-slate-400">أكبر مساحة</div>
                                        <span className="material-symbols-outlined text-xl text-sky-600 opacity-60 dark:text-sky-400">straighten</span>
                                    </div>
                                    <div className="mt-4 flex items-end justify-between gap-3">
                                        <span className="type-metric text-[#0e111b] dark:text-white">{summaryStats.largestArea.toLocaleString('ar-EG')}</span>
                                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-[#4e5f97] dark:bg-[#121520] dark:text-slate-400">م²</span>
                                    </div>
                                </div>
                            </div>

                            <div className="section-divider"></div>

                            <div className="mt-4">
                                <FavoritesDesktopControls
                                    sortBy={sortBy}
                                    filters={filters}
                                    onSortChange={setSortBy}
                                    onFiltersChange={setFilters}
                                    resultsCount={filteredFavorites.length}
                                    totalCount={favorites.length}
                                    hasActiveControls={hasActiveControls}
                                    onReset={resetControls}
                                />
                            </div>
                        </div>

                        <div className="mx-auto max-w-7xl px-4 pb-6 lg:max-w-[1280px]">
                            {filteredFavorites.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
                                <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 py-16 text-center dark:border-[#2a3142]">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-[#1e2130]">
                                        <span className="material-symbols-outlined text-3xl text-[#4e5f97] dark:text-slate-400">filter_alt_off</span>
                                    </div>
                                    <h3 className="mb-2 type-title text-[#0e111b] dark:text-white">لا توجد نتائج مطابقة</h3>
                                    <p className="max-w-xs type-body text-[#4e5f97] dark:text-slate-400">
                                        لم نعثر على أي عقارات تطابق الفلاتر الحالية.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={resetControls}
                                        className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-all hover:bg-primary/90"
                                    >
                                        إلغاء التصفية
                                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-white p-10 text-center shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:border-[#2a3142] dark:bg-[#1e2130]">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-4xl">favorite</span>
                        </div>

                        <h3 className="type-headline text-[#0e111b] dark:text-white">لا توجد عقارات مفضلة</h3>
                        <p className="mx-auto mt-3 max-w-md type-body text-[#4e5f97] dark:text-slate-400">
                            لم تحفظ أي عقارات بعد. ابحث عن عقار يعجبك واضغط على قلب حفظه ليرجع هنا لاحقاً.
                        </p>

                        <Link
                            href="/search"
                            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-[0_4px_20px_-2px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                        >
                            تصفح العقارات
                            <span className="material-symbols-outlined text-[18px] rtl:rotate-180">arrow_forward</span>
                        </Link>
                    </div>
                )}

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
        </div>
    );
}
