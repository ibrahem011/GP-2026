'use client';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import FavoritesStatsPanel, { type FavoritesSummaryStats } from './FavoritesStatsPanel';
export type { FavoritesSummaryStats } from './FavoritesStatsPanel';

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
        <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <SheetContent
                side="bottom"
                className="rounded-t-[2rem] border-x-0 border-b-0 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-8 sm:max-w-none dark:border-[#2a3142] dark:bg-[#1e2130]"
            >
                <div className="mx-auto max-w-md" data-testid="favorites-stats-sheet">
                    <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-white/10" />
                    <SheetHeader className="text-right sm:text-right">
                        <SheetTitle className="text-xl font-black">إحصاءات المفضلة</SheetTitle>
                        <SheetDescription className="text-sm leading-6 text-slate-500 dark:text-slate-300">
                            راجع حجم المفضلة ومتوسط الأسعار بسرعة، ثم ارجع للقائمة لاختيار العقار الأنسب.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-4">
                        <FavoritesStatsPanel stats={stats} className="grid-cols-2" />
                        
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-primary font-bold text-white transition-all hover:bg-primary/90"
                        >
                            تم
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
