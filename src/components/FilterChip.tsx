interface FilterChipProps {
    label: string;
    count?: number;
    active: boolean;
    onClick: () => void;
}

export default function FilterChip({ label, count, active, onClick }: FilterChipProps) {
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 active:scale-95 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary ${active
                    ? 'bg-primary text-white shadow-md shadow-primary/30 ring-2 ring-primary/20 ring-offset-2 ring-offset-gray-50 dark:ring-offset-black'
                    : 'bg-white dark:bg-zinc-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10'
                }`}
        >
            {label}
            {count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}
