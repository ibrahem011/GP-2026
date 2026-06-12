interface StatCardProps {
    label: string;
    value: number;
    icon: string;
    color: 'blue' | 'green' | 'purple';
}

export default function StatCard({ label, value, icon, color }: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400',
        purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
    }[color];

    const gradientClasses = {
        blue: 'from-transparent via-blue-500 to-transparent',
        green: 'from-transparent via-green-500 to-transparent',
        purple: 'from-transparent via-purple-500 to-transparent',
    }[color];

    return (
        <div className="relative group bg-white dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-5 border border-gray-100 dark:border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 overflow-hidden">
            <div className={`absolute top-0 inset-x-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r ${gradientClasses}`} />
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${colorClasses}`}>
                    <span aria-hidden="true" className="material-symbols-outlined text-[24px]">{icon}</span>
                </div>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</span>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
        </div>
    );
}
