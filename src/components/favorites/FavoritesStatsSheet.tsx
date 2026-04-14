'use client';

import BottomSheet from '@/components/search/BottomSheet';
import FavoritesStatsPanel, { type FavoritesSummaryStats } from './FavoritesStatsPanel';

type FavoritesStatsSheetProps = {
    open: boolean;
    onClose: () => void;
    stats: FavoritesSummaryStats;
};

export default function FavoritesStatsSheet({
    open,
    onClose,
    stats,
}: FavoritesStatsSheetProps) {
    return (
        <BottomSheet
            open={open}
            title="إحصاءات المفضلة"
            onClose={onClose}
            footer={
                <button
                    type="button"
                    onClick={onClose}
                    className="h-12 w-full rounded-2xl bg-primary font-bold text-white"
                >
                    تم
                </button>
            }
        >
            <div className="space-y-4" data-testid="favorites-stats-sheet">
                <div className="rounded-[1.6rem] border border-primary/10 bg-primary/5 p-4 text-right dark:border-primary/20 dark:bg-primary/10">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                        نظرة سريعة على قائمتك
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                        راجع حجم المفضلة ومتوسط الأسعار بسرعة، ثم ارجع للقائمة لاختيار العقار
                        الأنسب.
                    </p>
                </div>

                <FavoritesStatsPanel stats={stats} className="grid-cols-2" />
            </div>
        </BottomSheet>
    );
}
