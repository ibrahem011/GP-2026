'use client';

import Link from 'next/link';
import { RefObject } from 'react';

type MyPropertiesMobileActionsProps = {
    onOpenFilters: () => void;
    onOpenStats: () => void;
    activeCount: number;
    resultsCount: number;
    totalCount: number;
    filterButtonRef?: RefObject<HTMLButtonElement | null>;
    statsButtonRef?: RefObject<HTMLButtonElement | null>;
};

export default function MyPropertiesMobileActions({
    onOpenFilters,
    onOpenStats,
    activeCount,
    resultsCount,
    totalCount,
    filterButtonRef,
    statsButtonRef,
}: MyPropertiesMobileActionsProps) {
    return (
        <div
            className="fixed inset-x-0 z-40 md:hidden"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + var(--chrome-bottom) + 12px)' }}
            data-testid="my-properties-mobile-actions-bar"
        >
            <div className="mx-auto max-w-md px-3 relative">
                {/* Floating Add Button */}
                <div className="absolute left-3 -top-16 rtl:left-auto rtl:right-3">
                    <Link
                        href="/add-property"
                        aria-label="إضافة عقار"
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_30px_-4px_rgba(37,99,235,0.4)] transition-transform active:scale-95"
                    >
                        <span className="material-symbols-outlined text-3xl">add</span>
                    </Link>
                </div>

                <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/92 p-2 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] backdrop-blur dark:border-[#2a3142]/80 dark:bg-[#1e2130]/90">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            ref={filterButtonRef}
                            onClick={onOpenFilters}
                            aria-label="فتح فلترة وترتيب الموبايل"
                            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-sm font-bold text-[#0e111b] transition-all hover:bg-slate-50 active:scale-[0.98] dark:text-white dark:hover:bg-white/5"
                        >
                            <span className="material-symbols-outlined text-[20px]">tune</span>
                            <span>فلترة</span>
                            {activeCount > 0 ? (
                                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                                    {activeCount}
                                </span>
                            ) : null}
                        </button>

                        <button
                            type="button"
                            ref={statsButtonRef}
                            onClick={onOpenStats}
                            aria-label="فتح الإحصاءات"
                            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-sm font-bold text-[#0e111b] transition-all hover:bg-slate-50 active:scale-[0.98] dark:text-white dark:hover:bg-white/5"
                        >
                            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                            <span>الإحصاءات</span>
                        </button>
                    </div>
                </div>

                <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    عرض <span className="font-bold">{resultsCount.toLocaleString('ar-EG')}</span> من أصل{' '}
                    <span className="font-bold">{totalCount.toLocaleString('ar-EG')}</span>
                </div>
            </div>
        </div>
    );
}
