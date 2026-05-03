'use client';

type FloatingActionsProps = {
    onOpenFilters: () => void;
    onOpenSort: () => void;
    onToggleMap: () => void;
    viewMode: 'list' | 'map';
    appliedCount: number;
    resultsCount: number;
};

export default function FloatingActions({
    onOpenFilters,
    onOpenSort,
    onToggleMap,
    viewMode,
    appliedCount,
    resultsCount,
}: FloatingActionsProps) {
    return (
        <div
            className="md:hidden fixed left-0 right-0 z-40"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + var(--chrome-bottom) + 12px)' }}
        >
            <div className="mx-auto max-w-md px-3">
                <div className="bg-white/90 dark:bg-black/80 backdrop-blur border border-gray-200 dark:border-white/10 shadow-xl rounded-2xl p-2 flex items-center justify-between">
                    {/* Filters */}
                    <button
                        onClick={onOpenFilters}
                        className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/10 transition"
                    >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">tune</span>
                        <span className="text-sm font-semibold">فلترة</span>

                        {appliedCount > 0 && (
                            <span className="ml-1 text-xs font-bold bg-primary text-white rounded-full px-2 py-0.5">
                                {appliedCount}
                            </span>
                        )}
                    </button>

                    <div className="w-px h-7 bg-gray-200 dark:bg-white/10" />

                    {/* Map/List toggle */}
                    <button
                        onClick={onToggleMap}
                        className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/10 transition"
                    >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                            {viewMode === 'list' ? 'map' : 'view_list'}
                        </span>
                        <span className="text-sm font-semibold">{viewMode === 'list' ? 'الخريطة' : 'قائمة'}</span>
                    </button>

                    <div className="w-px h-7 bg-gray-200 dark:bg-white/10" />

                    {/* Sort */}
                    <button
                        onClick={onOpenSort}
                        className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/10 transition"
                    >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">sort</span>
                        <span className="text-sm font-semibold">ترتيب</span>
                    </button>
                </div>

                <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                    عرض <span className="font-bold">{resultsCount}</span> مسكن
                </div>
            </div>
        </div>
    );
}
