import { cn } from '@/lib/utils';

export interface MyPropertiesSummaryStats {
    total: number;
    available: number;
    rented: number;
    totalViews: number;
}

type MyPropertiesStatsPanelProps = {
    stats: MyPropertiesSummaryStats;
    className?: string;
};

const statItems = [
    {
        key: 'total',
        icon: 'home_work',
        accent: 'bg-primary/10 text-primary',
        label: 'إجمالي العقارات',
    },
    {
        key: 'available',
        icon: 'check_circle',
        accent: 'bg-emerald-500/10 text-emerald-600',
        label: 'متاح الآن',
    },
    {
        key: 'rented',
        icon: 'apartment',
        accent: 'bg-sky-500/10 text-sky-600',
        label: 'مؤجر حالياً',
    },
    {
        key: 'totalViews',
        icon: 'visibility',
        accent: 'bg-amber-500/10 text-amber-600',
        label: 'إجمالي المشاهدات',
    },
] as const;

function formatValue(key: (typeof statItems)[number]['key'], stats: MyPropertiesSummaryStats) {
    return stats[key].toLocaleString('ar-EG');
}

export default function MyPropertiesStatsPanel({
    stats,
    className,
}: MyPropertiesStatsPanelProps) {
    return (
        <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>
            {statItems.map((item) => (
                <div
                    key={item.key}
                    className="flex flex-col items-center justify-center rounded-[1.35rem] border border-slate-200/80 bg-slate-50 p-4 text-center shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:border-[#2a3142] dark:bg-[#121520]"
                >
                    <div
                        className={cn(
                            'mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl',
                            item.accent,
                        )}
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                    </div>

                    <p className="text-xs font-bold text-slate-400">{item.label}</p>
                    <p className="mt-1.5 text-xl font-black text-slate-900 dark:text-white">
                        {formatValue(item.key, stats)}
                    </p>
                </div>
            ))}
        </div>
    );
}
