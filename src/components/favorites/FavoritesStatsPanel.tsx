import { cn } from '@/lib/utils';

export interface FavoritesSummaryStats {
    total: number;
    verifiedCount: number;
    averagePrice: number;
    largestArea: number;
}

type FavoritesStatsPanelProps = {
    stats: FavoritesSummaryStats;
    className?: string;
};

type StatItem = {
    key: keyof FavoritesSummaryStats;
    icon: string;
    accent: string;
    label: string;
    suffix?: string;
};

const statItems: StatItem[] = [
    {
        key: 'total',
        icon: 'favorite',
        accent: 'bg-primary/10 text-primary',
        label: 'إجمالي المفضلة',
    },
    {
        key: 'verifiedCount',
        icon: 'verified',
        accent: 'bg-emerald-500/10 text-emerald-600',
        label: 'عقارات موثقة',
    },
    {
        key: 'averagePrice',
        icon: 'payments',
        accent: 'bg-amber-500/10 text-amber-600',
        label: 'متوسط السعر',
        suffix: 'ج.م',
    },
    {
        key: 'largestArea',
        icon: 'straighten',
        accent: 'bg-sky-500/10 text-sky-600',
        label: 'أكبر مساحة',
        suffix: 'م²',
    },
] as const;

function formatValue(key: StatItem['key'], stats: FavoritesSummaryStats) {
    const value = stats[key];
    return value.toLocaleString('ar-EG');
}

export default function FavoritesStatsPanel({ stats, className }: FavoritesStatsPanelProps) {
    return (
        <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>
            {statItems.map((item) => (
                <div
                    key={item.key}
                    className="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                >
                    <div
                        className={cn(
                            'mb-3 flex h-11 w-11 items-center justify-center rounded-2xl',
                            item.accent,
                        )}
                    >
                        <span aria-hidden="true" className="material-symbols-outlined">{item.icon}</span>
                    </div>

                    <p className="text-xs font-bold text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                        {formatValue(item.key, stats)}
                    </p>
                    {item.suffix ? (
                        <p className="mt-1 text-xs font-medium text-slate-400">{item.suffix}</p>
                    ) : null}
                </div>
            ))}
        </div>
    );
}
