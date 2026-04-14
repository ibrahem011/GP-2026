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
            <div className="mx-auto max-w-md px-3">
                <div className="rounded-[1.6rem] border border-gray-200 bg-white/92 p-2 shadow-xl backdrop-blur dark:border-white/10 dark:bg-black/82">
                    <div className="grid grid-cols-3 gap-2">
                        <Link
                            href="/add-property"
                            aria-label="إضافة عقار"
                            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-white transition-all active:scale-[0.98]"
                        >
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            <span>إضافة</span>
                        </Link>

                        <button
                            type="button"
                            ref={filterButtonRef}
                            onClick={onOpenFilters}
                            aria-label="فتح فلترة وترتيب الموبايل"
                            className="flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-gray-800 transition-all hover:bg-gray-50 active:scale-[0.98] dark:text-gray-100 dark:hover:bg-white/10"
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
                            className="flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-gray-800 transition-all hover:bg-gray-50 active:scale-[0.98] dark:text-gray-100 dark:hover:bg-white/10"
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
