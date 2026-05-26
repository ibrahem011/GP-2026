'use client';

import { useMemo, useState } from 'react';
import { PROPERTY_FEATURES } from '@/config/features';
import { CATEGORY_AR, type PropertyCategory } from '@/types';
import { cn } from '@/lib/utils';
import { FavoritesFilters, type FavoritesSort } from './FavoritesFilterSortSheet';

type FavoritesDesktopControlsProps = {
    sortBy: FavoritesSort;
    filters: FavoritesFilters;
    onSortChange: (sort: FavoritesSort) => void;
    onFiltersChange: (filters: FavoritesFilters) => void;
    resultsCount: number;
    totalCount: number;
    hasActiveControls: boolean;
    onReset: () => void;
};

const categoryOptions: Array<{ value: 'all' | PropertyCategory; label: string }> = [
    { value: 'all', label: 'الكل' },
    { value: 'apartment', label: CATEGORY_AR.apartment },
    { value: 'villa', label: CATEGORY_AR.villa },
    { value: 'chalet', label: CATEGORY_AR.chalet },
    { value: 'studio', label: CATEGORY_AR.studio },
    { value: 'room', label: CATEGORY_AR.room },
];

const sortOptions: Array<{ value: FavoritesSort; label: string }> = [
    { value: 'newest', label: 'الأحدث أولاً' },
    { value: 'price_desc', label: 'السعر من الأعلى إلى الأقل' },
    { value: 'price_asc', label: 'السعر من الأقل إلى الأعلى' },
    { value: 'area_desc', label: 'المساحة الأكبر أولاً' },
];

export default function FavoritesDesktopControls({
    sortBy,
    filters,
    onSortChange,
    onFiltersChange,
    resultsCount,
    totalCount,
    hasActiveControls,
    onReset,
}: FavoritesDesktopControlsProps) {
    const [showAllFeatures, setShowAllFeatures] = useState(false);

    const activePills = useMemo(() => {
        const pills: Array<{ key: string; label: string; onRemove: () => void }> = [];

        if (sortBy !== 'newest') {
            const label = sortOptions.find((o) => o.value === sortBy)?.label ?? sortBy;
            pills.push({
                key: 'sort',
                label,
                onRemove: () => onSortChange('newest'),
            });
        }

        if (filters.category !== 'all') {
            const label = categoryOptions.find((o) => o.value === filters.category)?.label ?? filters.category;
            pills.push({
                key: 'category',
                label,
                onRemove: () => onFiltersChange({ ...filters, category: 'all' }),
            });
        }

        if (filters.minPrice.trim()) {
            pills.push({
                key: 'minPrice',
                label: `من ${Number(filters.minPrice).toLocaleString('ar-EG')} ج.م`,
                onRemove: () => onFiltersChange({ ...filters, minPrice: '' }),
            });
        }

        if (filters.maxPrice.trim()) {
            pills.push({
                key: 'maxPrice',
                label: `إلى ${Number(filters.maxPrice).toLocaleString('ar-EG')} ج.م`,
                onRemove: () => onFiltersChange({ ...filters, maxPrice: '' }),
            });
        }

        filters.selectedFeatures.forEach((featureId) => {
            const feature = PROPERTY_FEATURES.find((f) => f.id === featureId);
            if (feature) {
                pills.push({
                    key: `feature-${featureId}`,
                    label: feature.label,
                    onRemove: () =>
                        onFiltersChange({
                            ...filters,
                            selectedFeatures: filters.selectedFeatures.filter((id) => id !== featureId),
                        }),
                });
            }
        });

        return pills;
    }, [sortBy, filters, onSortChange, onFiltersChange]);

    const toggleFeature = (featureId: string) => {
        const next = filters.selectedFeatures.includes(featureId)
            ? filters.selectedFeatures.filter((id) => id !== featureId)
            : [...filters.selectedFeatures, featureId];
        onFiltersChange({ ...filters, selectedFeatures: next });
    };

    return (
        <div
            className="rounded-[24px] border border-slate-200/70 bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:border-[#2a3142] dark:bg-[#1e2130]"
            data-testid="favorites-desktop-controls"
        >
            <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-start gap-3">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
                            <span className="material-symbols-outlined text-[16px]">favorite</span>
                            {resultsCount.toLocaleString('ar-EG')} من {totalCount.toLocaleString('ar-EG')}
                        </div>

                        {hasActiveControls ? (
                            <button
                                type="button"
                                onClick={onReset}
                                className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-500 transition-all hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                            >
                                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                                إعادة التصفية
                            </button>
                        ) : null}
                    </div>

                    <div className="flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-[#2a3142] dark:bg-[#121520]">
                        <span className="material-symbols-outlined text-[18px] text-[#4e5f97] dark:text-slate-400">
                            sort
                        </span>
                        <select
                            aria-label="ترتيب المفضلة"
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value as FavoritesSort)}
                            className="bg-transparent text-sm font-bold text-[#0e111b] outline-none dark:text-white"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-[#2a3142]" />

                <div className="space-y-4">
                    <div>
                        <p className="mb-2 text-xs font-bold text-[#4e5f97] dark:text-slate-400">نوع العقار</p>
                        <div className="flex flex-wrap gap-2">
                            {categoryOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onFiltersChange({ ...filters, category: option.value })}
                                    className={cn(
                                        'rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all',
                                        filters.category === option.value
                                            ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-primary dark:border-[#2a3142] dark:bg-[#121520] dark:text-slate-200 dark:hover:border-primary/40 dark:hover:text-primary',
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-bold text-[#4e5f97] dark:text-slate-400">نطاق السعر (ج.م)</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                inputMode="numeric"
                                placeholder="من"
                                value={filters.minPrice}
                                onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value })}
                                className="w-[140px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-[#0e111b] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-[#2a3142] dark:bg-[#121520] dark:text-white"
                            />
                            <span className="text-xs text-slate-400">—</span>
                            <input
                                type="number"
                                inputMode="numeric"
                                placeholder="إلى"
                                value={filters.maxPrice}
                                onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value })}
                                className="w-[140px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-[#0e111b] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-[#2a3142] dark:bg-[#121520] dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-bold text-[#4e5f97] dark:text-slate-400">المميزات</p>
                        <div className="flex flex-wrap gap-2">
                            {(showAllFeatures ? PROPERTY_FEATURES : PROPERTY_FEATURES.slice(0, 8)).map((feature) => {
                                const isSelected = filters.selectedFeatures.includes(feature.id);
                                return (
                                    <button
                                        key={feature.id}
                                        type="button"
                                        onClick={() => toggleFeature(feature.id)}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all',
                                            isSelected
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-primary dark:border-[#2a3142] dark:bg-[#121520] dark:text-slate-200 dark:hover:border-primary/40 dark:hover:text-primary',
                                        )}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">{feature.icon}</span>
                                        {feature.label}
                                    </button>
                                );
                            })}

                            {PROPERTY_FEATURES.length > 8 && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllFeatures((v) => !v)}
                                    className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-[#4e5f97] transition-all hover:border-primary/40 hover:text-primary dark:border-[#2a3142] dark:text-slate-400 dark:hover:text-primary"
                                >
                                    {showAllFeatures ? 'عرض أقل' : `+${PROPERTY_FEATURES.length - 8} المزيد`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {activePills.length > 0 && (
                    <>
                        <div className="h-px bg-slate-100 dark:bg-[#2a3142]" />
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-[#4e5f97] dark:text-slate-400">الفلاتر النشطة:</span>
                            {activePills.map((pill) => (
                                <button
                                    key={pill.key}
                                    type="button"
                                    onClick={pill.onRemove}
                                    className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:border-primary/40 hover:bg-primary/15"
                                >
                                    {pill.label}
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}