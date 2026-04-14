'use client';

type FavoritesMobileActionsProps = {
    onOpenFilters: () => void;
    onOpenStats: () => void;
    activeCount: number;
    resultsCount: number;
    totalCount: number;
};

export default function FavoritesMobileActions({
    onOpenFilters,
    onOpenStats,
    activeCount,
    resultsCount,
    totalCount,
}: FavoritesMobileActionsProps) {
    return (
        <div
            className="fixed inset-x-0 z-40 md:hidden"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
            data-testid="favorites-mobile-actions-bar"
        >
            <div className="mx-auto max-w-md px-3">
                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/92 p-2 shadow-xl backdrop-blur dark:border-white/10 dark:bg-black/82">
                    <button
                        type="button"
                        onClick={onOpenFilters}
                        aria-label="فتح فلترة وترتيب الموبايل"
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-gray-800 transition hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-[20px]">tune</span>
                        <span className="text-sm font-semibold">فلترة وترتيب</span>
                        {activeCount > 0 ? (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                                {activeCount}
                            </span>
                        ) : null}
                    </button>

                    <div className="h-7 w-px bg-gray-200 dark:bg-white/10" />

                    <button
                        type="button"
                        onClick={onOpenStats}
                        aria-label="فتح الإحصاءات"
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-gray-800 transition hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                        <span className="text-sm font-semibold">الإحصاءات</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-gray-200">
                            {totalCount}
                        </span>
                    </button>
                </div>

                <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    عرض <span className="font-bold">{resultsCount}</span> من أصل{' '}
                    <span className="font-bold">{totalCount}</span>
                </div>
            </div>
        </div>
    );
}
