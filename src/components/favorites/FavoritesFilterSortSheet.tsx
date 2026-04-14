'use client';

import { useEffect, useMemo, useState } from 'react';
import BottomSheet from '@/components/search/BottomSheet';
import { PROPERTY_FEATURES } from '@/config/features';
import { cn } from '@/lib/utils';
import { CATEGORY_AR, type PropertyCategory } from '@/types';

export type FavoritesSort = 'newest' | 'price_desc' | 'price_asc' | 'area_desc';

export type FavoritesFilters = {
    category: 'all' | PropertyCategory;
    minPrice: string;
    maxPrice: string;
    selectedFeatures: string[];
};

export const DEFAULT_FAVORITES_FILTERS: FavoritesFilters = {
    category: 'all',
    minPrice: '',
    maxPrice: '',
    selectedFeatures: [],
};

const sortOptions: Array<{ value: FavoritesSort; label: string; icon: string }> = [
    { value: 'newest', label: 'الأحدث أولاً', icon: 'schedule' },
    { value: 'price_desc', label: 'السعر من الأعلى إلى الأقل', icon: 'north' },
    { value: 'price_asc', label: 'السعر من الأقل إلى الأعلى', icon: 'south' },
    { value: 'area_desc', label: 'المساحة الأكبر أولاً', icon: 'straighten' },
];

const categoryOptions: Array<{ value: 'all' | PropertyCategory; label: string }> = [
    { value: 'all', label: 'الكل' },
    { value: 'apartment', label: CATEGORY_AR.apartment },
    { value: 'villa', label: CATEGORY_AR.villa },
    { value: 'chalet', label: CATEGORY_AR.chalet },
    { value: 'studio', label: CATEGORY_AR.studio },
    { value: 'room', label: CATEGORY_AR.room },
];

type FavoritesFilterSortSheetProps = {
    open: boolean;
    onClose: () => void;
    sortBy: FavoritesSort;
    filters: FavoritesFilters;
    onApply: (next: { sortBy: FavoritesSort; filters: FavoritesFilters }) => void;
};

export default function FavoritesFilterSortSheet({
    open,
    onClose,
    sortBy,
    filters,
    onApply,
}: FavoritesFilterSortSheetProps) {
    const [draftSort, setDraftSort] = useState<FavoritesSort>(sortBy);
    const [draftFilters, setDraftFilters] = useState<FavoritesFilters>(filters);
    const [showAllFeatures, setShowAllFeatures] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setDraftSort(sortBy);
        setDraftFilters(filters);
        setShowAllFeatures(false);
    }, [filters, open, sortBy]);

    const activeCount = useMemo(() => {
        let count = 0;
        if (draftSort !== 'newest') count += 1;
        if (draftFilters.category !== 'all') count += 1;
        if (draftFilters.minPrice.trim()) count += 1;
        if (draftFilters.maxPrice.trim()) count += 1;
        if (draftFilters.selectedFeatures.length > 0) count += 1;
        return count;
    }, [draftFilters, draftSort]);

    const toggleFeature = (featureId: string) => {
        setDraftFilters((current) => ({
            ...current,
            selectedFeatures: current.selectedFeatures.includes(featureId)
                ? current.selectedFeatures.filter((value) => value !== featureId)
                : [...current.selectedFeatures, featureId],
        }));
    };

    const resetDraft = () => {
        setDraftSort('newest');
        setDraftFilters(DEFAULT_FAVORITES_FILTERS);
        setShowAllFeatures(false);
    };

    const applyDraft = () => {
        onApply({
            sortBy: draftSort,
            filters: draftFilters,
        });
        onClose();
    };

    return (
        <BottomSheet
            open={open}
            title="فلترة وترتيب"
            onClose={onClose}
            footer={
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={resetDraft}
                        className="h-12 flex-1 rounded-2xl border border-gray-200 bg-white font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                    >
                        مسح الكل
                    </button>
                    <button
                        type="button"
                        onClick={applyDraft}
                        className="h-12 flex-[1.4] rounded-2xl bg-primary font-bold text-white"
                    >
                        عرض النتائج
                    </button>
                </div>
            }
        >
            <div className="space-y-6" data-testid="favorites-filter-sheet">
                <div className="flex items-center justify-between rounded-[1.4rem] border border-primary/10 bg-primary/5 px-4 py-3 dark:border-primary/20 dark:bg-primary/10">
                    <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                            اضبط الصفحة على مزاجك
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                            {activeCount > 0
                                ? `${activeCount.toLocaleString('ar-EG')} إعدادات نشطة حالياً`
                                : 'لا توجد تصفية أو ترتيب مخصص حالياً'}
                        </p>
                    </div>

                    <span className="material-symbols-outlined text-primary">tune</span>
                </div>

                <section className="space-y-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        ترتيب النتائج
                    </h3>
                    <div className="space-y-2">
                        {sortOptions.map((option) => {
                            const isActive = draftSort === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setDraftSort(option.value)}
                                    className={cn(
                                        'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-right transition-all',
                                        isActive
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-gray-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100',
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined">
                                            {option.icon}
                                        </span>
                                        <span className="text-sm font-semibold">{option.label}</span>
                                    </div>

                                    {isActive ? (
                                        <span className="material-symbols-outlined text-[20px]">
                                            check
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        نوع العقار
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {categoryOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                    setDraftFilters((current) => ({
                                        ...current,
                                        category: option.value,
                                    }))
                                }
                                className={cn(
                                    'rounded-full border px-4 py-2 text-sm font-bold transition-all',
                                    draftFilters.category === option.value
                                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'border-gray-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        نطاق السعر
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="favorites-min-price"
                                className="text-xs font-medium text-slate-500 dark:text-slate-300"
                            >
                                من
                            </label>
                            <input
                                id="favorites-min-price"
                                type="number"
                                inputMode="numeric"
                                placeholder="0"
                                value={draftFilters.minPrice}
                                onChange={(event) =>
                                    setDraftFilters((current) => ({
                                        ...current,
                                        minPrice: event.target.value,
                                    }))
                                }
                                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="favorites-max-price"
                                className="text-xs font-medium text-slate-500 dark:text-slate-300"
                            >
                                إلى
                            </label>
                            <input
                                id="favorites-max-price"
                                type="number"
                                inputMode="numeric"
                                placeholder="5000"
                                value={draftFilters.maxPrice}
                                onChange={(event) =>
                                    setDraftFilters((current) => ({
                                        ...current,
                                        maxPrice: event.target.value,
                                    }))
                                }
                                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            المميزات
                        </h3>

                        {PROPERTY_FEATURES.length > 8 ? (
                            <button
                                type="button"
                                onClick={() => setShowAllFeatures((current) => !current)}
                                className="text-xs font-bold text-primary"
                            >
                                {showAllFeatures ? 'عرض أقل' : 'عرض المزيد'}
                            </button>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {(showAllFeatures ? PROPERTY_FEATURES : PROPERTY_FEATURES.slice(0, 8)).map(
                            (feature) => {
                                const isSelected = draftFilters.selectedFeatures.includes(feature.id);

                                return (
                                    <button
                                        key={feature.id}
                                        type="button"
                                        onClick={() => toggleFeature(feature.id)}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-all',
                                            isSelected
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-gray-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
                                        )}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {feature.icon}
                                        </span>
                                        {feature.label}
                                    </button>
                                );
                            },
                        )}
                    </div>
                </section>
            </div>
        </BottomSheet>
    );
}
