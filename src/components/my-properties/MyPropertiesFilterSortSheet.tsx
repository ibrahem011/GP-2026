'use client';

import { RefObject, useEffect, useMemo, useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Property, PropertyCategory, PropertyStatus } from '@/types';
import { CATEGORY_AR } from '@/types';
import type { FilterOption, SortOption } from '@/hooks/usePropertyFilters';

const sortOptions: Array<{ value: SortOption; label: string; icon: string }> = [
    { value: 'newest', label: 'الأحدث أولاً', icon: 'schedule' },
    { value: 'oldest', label: 'الأقدم أولاً', icon: 'history' },
    { value: 'views', label: 'الأكثر مشاهدة', icon: 'visibility' },
    { value: 'price_high', label: 'السعر من الأعلى', icon: 'north' },
    { value: 'price_low', label: 'السعر من الأقل', icon: 'south' },
];

const statusOptions: Array<{ value: PropertyStatus; label: string; icon: string }> = [
    { value: 'available', label: 'متاح', icon: 'check_circle' },
    { value: 'rented', label: 'مؤجر', icon: 'apartment' },
];

type MyPropertiesFilterSortSheetProps = {
    open: boolean;
    onClose: () => void;
    sortBy: SortOption;
    filter: FilterOption;
    properties: Property[];
    availableCount: number;
    rentedCount: number;
    uniqueCategories: PropertyCategory[];
    onApply: (next: { sortBy: SortOption; filter: FilterOption }) => void;
    returnFocusRef?: RefObject<HTMLElement | null>;
};

export default function MyPropertiesFilterSortSheet({
    open,
    onClose,
    sortBy,
    filter,
    properties,
    availableCount,
    rentedCount,
    uniqueCategories,
    onApply,
    returnFocusRef,
}: MyPropertiesFilterSortSheetProps) {
    const [draftSort, setDraftSort] = useState<SortOption>(sortBy);
    const [draftFilter, setDraftFilter] = useState<FilterOption>(filter);

    useEffect(() => {
        if (!open) {
            return;
        }

        setDraftSort(sortBy);
        setDraftFilter(filter);
    }, [filter, open, sortBy]);

    const activeCount = useMemo(() => {
        let count = 0;
        if (draftSort !== 'newest') count += 1;
        if (draftFilter !== null) count += 1;
        return count;
    }, [draftFilter, draftSort]);

    const previewCount = useMemo(() => {
        if (!draftFilter) {
            return properties.length;
        }

        return properties.filter(
            (property) => property.status === draftFilter || property.category === draftFilter,
        ).length;
    }, [draftFilter, properties]);

    const applyDraft = () => {
        onApply({ sortBy: draftSort, filter: draftFilter });
        onClose();
    };

    return (
        <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <SheetContent
                side="bottom"
                className="h-[calc(100vh-2rem)] overflow-y-auto rounded-t-[2rem] border-x-0 border-b-0 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-8 sm:max-w-none dark:border-[#2a3142] dark:bg-[#1e2130]"
                onCloseAutoFocus={(event) => {
                    if (!returnFocusRef?.current) {
                        return;
                    }

                    event.preventDefault();
                    returnFocusRef.current.focus();
                }}
            >
                <div className="mx-auto max-w-md" data-testid="my-properties-filter-sheet">
                    <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-white/10" />
                    <SheetHeader className="text-right sm:text-right">
                        <SheetTitle className="text-xl font-black">فلترة وترتيب</SheetTitle>
                        <SheetDescription className="text-sm leading-6 text-slate-500 dark:text-slate-300">
                            عدّل الترتيب وحدد نوع العرض الأنسب، مع الحفاظ على التجربة سريعة
                            وواضحة على الموبايل.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                        <div className="flex items-center justify-between rounded-[1.4rem] border border-primary/10 bg-primary/5 px-4 py-3 dark:border-primary/20 dark:bg-primary/10">
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                    ضبط سريع للصفحة
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                                    {activeCount > 0
                                        ? `${activeCount.toLocaleString('ar-EG')} إعدادات نشطة`
                                        : 'لا توجد تصفية أو ترتيب مخصص حالياً'}
                                </p>
                            </div>
                            <span className="material-symbols-outlined text-primary">tune</span>
                        </div>

                        <section className="space-y-3">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                ترتيب العقارات
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
                                                <span className="text-sm font-semibold">
                                                    {option.label}
                                                </span>
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
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    حالة العقار
                                </h3>
                                <span className="text-xs font-medium text-slate-400">
                                    فلتر واحد فقط
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDraftFilter(null)}
                                    className={cn(
                                        'rounded-full border px-4 py-2 text-sm font-bold transition-all',
                                        draftFilter === null
                                            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black'
                                            : 'border-gray-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
                                    )}
                                >
                                    الكل
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDraftFilter('available')}
                                    className={cn(
                                        'rounded-full border px-4 py-2 text-sm font-bold transition-all',
                                        draftFilter === 'available'
                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                            : 'border-gray-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
                                    )}
                                >
                                    متاح ({availableCount.toLocaleString('ar-EG')})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDraftFilter('rented')}
                                    className={cn(
                                        'rounded-full border px-4 py-2 text-sm font-bold transition-all',
                                        draftFilter === 'rented'
                                            ? 'border-sky-500 bg-sky-500 text-white'
                                            : 'border-gray-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
                                    )}
                                >
                                    مؤجر ({rentedCount.toLocaleString('ar-EG')})
                                </button>
                            </div>
                        </section>

                        {uniqueCategories.length > 0 ? (
                            <section className="space-y-3">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    نوع العقار
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {uniqueCategories.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setDraftFilter(category)}
                                            className={cn(
                                                'rounded-full border px-4 py-2 text-sm font-bold transition-all',
                                                draftFilter === category
                                                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                                    : 'border-gray-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
                                            )}
                                        >
                                            {CATEGORY_AR[category]}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </div>

                    <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => {
                                setDraftSort('newest');
                                setDraftFilter(null);
                            }}
                            className="h-12 flex-1 rounded-2xl border border-gray-200 bg-white font-bold text-slate-600 transition-all hover:border-primary/20 hover:text-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                        >
                            مسح الكل
                        </button>
                        <button
                            type="button"
                            onClick={applyDraft}
                            className="h-12 flex-[1.4] rounded-2xl bg-primary font-bold text-white transition-all hover:bg-primary/90"
                        >
                            عرض النتائج ({previewCount.toLocaleString('ar-EG')})
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
