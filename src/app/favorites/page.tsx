'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/PropertyCard';
import { PROPERTY_FEATURES } from '@/config/features';
import { useAuth } from '@/context/AuthContext';
import { fromPropertyRow } from '@/lib/propertyMapper';
import { supabaseService } from '@/services/supabaseService';
import { CATEGORY_AR, type Property, type PropertyCategory } from '@/types';
import { cn } from '@/lib/utils';

type FavoritesSort = 'newest' | 'price_desc' | 'price_asc' | 'area_desc';

const sortOptions: Array<{ value: FavoritesSort; label: string }> = [
    { value: 'newest', label: 'الأحدث أولاً' },
    { value: 'price_desc', label: 'السعر: من الأعلى إلى الأقل' },
    { value: 'price_asc', label: 'السعر: من الأقل إلى الأعلى' },
    { value: 'area_desc', label: 'المساحة: الأكبر أولاً' },
];

const categoryOptions: Array<{ value: 'all' | PropertyCategory; label: string }> = [
    { value: 'all', label: 'الكل' },
    { value: 'apartment', label: CATEGORY_AR.apartment },
    { value: 'villa', label: CATEGORY_AR.villa },
    { value: 'chalet', label: CATEGORY_AR.chalet },
    { value: 'studio', label: CATEGORY_AR.studio },
    { value: 'room', label: CATEGORY_AR.room },
];

const featureOptions = PROPERTY_FEATURES.slice(0, 6);

function formatCurrency(value: number) {
    return value.toLocaleString('ar-EG');
}

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<FavoritesSort>('newest');
    const [categoryFilter, setCategoryFilter] = useState<'all' | PropertyCategory>('all');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && user) {
            void fetchFavorites();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [user, authLoading]);

    const fetchFavorites = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabaseService.getFavorites(user.id);

            if (fetchError) {
                throw fetchError;
            }

            const mappedProperties: Property[] = (data ?? []).map(fromPropertyRow);
            setFavorites(mappedProperties);
        } catch (err) {
            console.error('[FavoritesPage Error]', err);
            setError('فشل جلب المفضلات. يرجى المحاولة مرة أخرى.');
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    const hasActiveFilters =
        sortBy !== 'newest' ||
        categoryFilter !== 'all' ||
        minPrice.trim() !== '' ||
        maxPrice.trim() !== '' ||
        selectedFeatures.length > 0;

    const filteredFavorites = useMemo(() => {
        const min = minPrice.trim() === '' ? null : Number(minPrice);
        const max = maxPrice.trim() === '' ? null : Number(maxPrice);

        const nextFavorites = favorites.filter((property) => {
            if (categoryFilter !== 'all' && property.category !== categoryFilter) {
                return false;
            }

            if (Number.isFinite(min) && min !== null && property.price < min) {
                return false;
            }

            if (Number.isFinite(max) && max !== null && property.price > max) {
                return false;
            }

            if (
                selectedFeatures.length > 0 &&
                !selectedFeatures.every((featureId) => property.features.includes(featureId))
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
    }, [favorites, sortBy, categoryFilter, minPrice, maxPrice, selectedFeatures]);

    const summaryStats = useMemo(() => {
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

    const resetFilters = () => {
        setSortBy('newest');
        setCategoryFilter('all');
        setMinPrice('');
        setMaxPrice('');
        setSelectedFeatures([]);
    };

    const toggleFeature = (featureId: string) => {
        setSelectedFeatures((current) =>
            current.includes(featureId)
                ? current.filter((value) => value !== featureId)
                : [...current, featureId],
        );
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black pb-24">
                <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg shadow-slate-200/60 dark:bg-white/5 dark:shadow-none">
                        <span className="material-symbols-outlined text-5xl text-primary">favorite</span>
                    </div>
                    <h1 className="mb-3 text-3xl font-black text-gray-900 dark:text-white">سجل الدخول أولاً</h1>
                    <p className="mb-8 max-w-md text-sm leading-7 text-gray-500 dark:text-gray-400">
                        للوصول إلى قائمة المفضلة الخاصة بك، سجّل الدخول حتى نعرض لك العقارات التي حفظتها
                        ونساعدك على الرجوع إليها بسرعة.
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
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#f3f5fb_100%)] pb-24 pt-24 dark:bg-black md:pb-16 md:pt-[104px]">
            <div className="mx-auto max-w-7xl px-4">
                <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-dark/75">
                    <div className="absolute -left-20 top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl dark:bg-primary/15" />

                    <div className="relative grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:p-6">
                        <div className="rounded-[1.8rem] bg-gradient-to-br from-white via-white to-slate-50/80 p-5 shadow-inner ring-1 ring-slate-100/80 dark:from-white/[0.04] dark:via-white/[0.03] dark:to-white/[0.02] dark:ring-white/10 md:p-7">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-black text-primary">
                                <span>{summaryStats.total.toLocaleString('ar-EG')}</span>
                                <span>وحدة محفوظة</span>
                            </div>

                            <div className="mt-5 max-w-3xl space-y-3">
                                <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">
                                    المفضلة
                                </h1>
                                <p className="max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300 md:text-base">
                                    صفحة منظمة ترجعك سريعًا للعقارات التي لفتت انتباهك، مع تصفية ذكية وبطاقات
                                    أوضح تساعدك على المقارنة واتخاذ القرار.
                                </p>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href="/search"
                                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                                >
                                    استكشف المزيد
                                    <span className="material-symbols-outlined text-[18px] rtl:rotate-180">
                                        arrow_forward
                                    </span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold transition-all',
                                        hasActiveFilters
                                            ? 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/15'
                                            : 'border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500',
                                    )}
                                >
                                    <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                                    إعادة التصفية
                                </button>
                            </div>

                            <div className="mt-8 grid gap-3 md:grid-cols-4">
                                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined">inventory_2</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400">إجمالي المحفوظات</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                                        {summaryStats.total.toLocaleString('ar-EG')}
                                    </p>
                                </div>

                                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                                        <span className="material-symbols-outlined">verified</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400">عقارات موثقة</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                                        {summaryStats.verifiedCount.toLocaleString('ar-EG')}
                                    </p>
                                </div>

                                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                                        <span className="material-symbols-outlined">payments</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400">متوسط السعر</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                                        {summaryStats.averagePrice ? formatCurrency(summaryStats.averagePrice) : '0'}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-400">ج.م</p>
                                </div>

                                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                                        <span className="material-symbols-outlined">straighten</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400">أكبر مساحة</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                                        {summaryStats.largestArea.toLocaleString('ar-EG')}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-400">م²</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <aside className="rounded-[1.8rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-surface-dark/90 xl:sticky xl:top-32">
                                <div className="mb-6 flex items-center justify-between gap-3">
                                    <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                                        <span className="material-symbols-outlined text-primary">tune</span>
                                        تصفية وتصنيف
                                    </h2>

                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="text-xs font-bold text-slate-400 transition-colors hover:text-primary"
                                    >
                                        مسح الكل
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            الترتيب حسب
                                        </label>
                                        <select
                                            value={sortBy}
                                            onChange={(event) => setSortBy(event.target.value as FavoritesSort)}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                                        >
                                            {sortOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            نوع العقار
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {categoryOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setCategoryFilter(option.value)}
                                                    className={cn(
                                                        'rounded-xl px-3 py-2 text-xs font-bold transition-all',
                                                        categoryFilter === option.value
                                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/20 hover:bg-primary/5 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300',
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            نطاق السعر
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                placeholder="من"
                                                value={minPrice}
                                                onChange={(event) => setMinPrice(event.target.value)}
                                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                                            />
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                placeholder="إلى"
                                                value={maxPrice}
                                                onChange={(event) => setMaxPrice(event.target.value)}
                                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            المميزات
                                        </label>
                                        <div className="space-y-2.5">
                                            {featureOptions.map((feature) => {
                                                const isChecked = selectedFeatures.includes(feature.id);

                                                return (
                                                    <label
                                                        key={feature.id}
                                                        className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 transition-all hover:border-primary/20 hover:bg-primary/5 dark:border-white/10 dark:bg-white/[0.04]"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-symbols-outlined text-primary">
                                                                {feature.icon}
                                                            </span>
                                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                                {feature.label}
                                                            </span>
                                                        </div>

                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleFeature(feature.id)}
                                                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                                                        />
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            <div className="overflow-hidden rounded-[1.8rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-white to-sky-50 p-5 shadow-sm dark:from-primary/12 dark:via-white/[0.03] dark:to-white/[0.02]">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-white/[0.08]">
                                    <span className="material-symbols-outlined">support_agent</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">تحتاج مساعدة؟</h3>
                                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
                                    إذا احتجت مساعدة في المقارنة بين العقارات أو اختيار الأنسب، فريقنا جاهز
                                    لمساعدتك بخطوات واضحة.
                                </p>
                                <button
                                    type="button"
                                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition-all hover:gap-3"
                                >
                                    تحدث معنا
                                    <span className="material-symbols-outlined text-[18px] rtl:rotate-180">
                                        arrow_forward
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-[420px] animate-pulse rounded-[2rem] border border-white/70 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="mt-10 rounded-[2rem] border border-red-200 bg-red-50/90 p-10 text-center shadow-sm dark:border-red-500/20 dark:bg-red-500/10">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
                            <span className="material-symbols-outlined text-3xl text-red-500">error</span>
                        </div>
                        <p className="font-bold text-red-600 dark:text-red-300">{error}</p>
                        <button
                            onClick={() => void fetchFavorites()}
                            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-red-600"
                        >
                            إعادة المحاولة
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                        </button>
                    </div>
                ) : favorites.length > 0 ? (
                    <>
                        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                    العقارات المحفوظة
                                </h2>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    يعرض {filteredFavorites.length.toLocaleString('ar-EG')} من أصل{' '}
                                    {favorites.length.toLocaleString('ar-EG')} عقار.
                                </p>
                            </div>

                            {hasActiveFilters ? (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:border-primary/20 hover:text-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
                                >
                                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                    إلغاء التصفية الحالية
                                </button>
                            ) : null}
                        </div>

                        {filteredFavorites.length > 0 ? (
                            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                                    جرّب توسيع نطاق السعر، اختيار نوع عقار مختلف، أو إزالة بعض المميزات حتى
                                    تظهر لك نتائج أكثر.
                                </p>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition-all hover:bg-primary/90"
                                >
                                    إلغاء التصفية
                                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mt-10 rounded-[2.2rem] border-2 border-dashed border-slate-200 bg-white/75 p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-4xl">favorite</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                            لا توجد عقارات مفضلة
                        </h3>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
                            عندما تعثر على عقار يعجبك، اضغط على زر القلب ليظهر هنا لاحقًا مع تجربة مقارنة
                            أوضح وأسهل.
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
        </div>
    );
}
