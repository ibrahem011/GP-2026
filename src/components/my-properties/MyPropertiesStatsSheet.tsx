'use client';

import { RefObject } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import MyPropertiesStatsPanel, { type MyPropertiesSummaryStats } from './MyPropertiesStatsPanel';

type MyPropertiesStatsSheetProps = {
    open: boolean;
    onClose: () => void;
    stats: MyPropertiesSummaryStats;
    returnFocusRef?: RefObject<HTMLElement | null>;
};

export default function MyPropertiesStatsSheet({
    open,
    onClose,
    stats,
    returnFocusRef,
}: MyPropertiesStatsSheetProps) {
    return (
        <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <SheetContent
                side="bottom"
                className="rounded-t-[2rem] border-x-0 border-b-0 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-8 sm:max-w-none dark:border-[#2a3142] dark:bg-[#1e2130]"
                onCloseAutoFocus={(event) => {
                    if (!returnFocusRef?.current) {
                        return;
                    }

                    event.preventDefault();
                    returnFocusRef.current.focus();
                }}
            >
                <div className="mx-auto max-w-md" data-testid="my-properties-stats-sheet">
                    <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-white/10" />
                    <SheetHeader className="text-right sm:text-right">
                        <SheetTitle className="text-xl font-black">إحصاءات عقاراتي</SheetTitle>
                        <SheetDescription className="text-sm leading-6 text-slate-500 dark:text-slate-300">
                            لمحة سريعة عن محفظتك الحالية حتى تعرف ما الذي يحتاج إلى متابعة
                            أسرع.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 rounded-[1.6rem] border border-primary/10 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/10">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            راقب الأداء بسرعة
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                            الإحصاءات هنا للرجوع السريع، بينما تبقى قائمة العقارات هي محور
                            التصفح الأساسي على الموبايل.
                        </p>
                    </div>

                    <MyPropertiesStatsPanel stats={stats} className="mt-4 grid-cols-2" />

                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-6 h-12 w-full rounded-2xl bg-primary font-bold text-white transition-all hover:bg-primary/90"
                    >
                        تم
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
