interface EmptyStateProps {
    icon: string;
    title: string;
    subtitle: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
    const ActionButton = action?.href ? 'a' : 'button';

    return (
        <div className="text-center py-20 bg-white dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-full animate-ping opacity-50"></div>
                <div className="relative w-full h-full bg-blue-50 dark:bg-blue-500/20 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-800 shadow-xl shadow-blue-500/10">
                    <span aria-hidden="true" className="material-symbols-outlined text-5xl text-blue-500 dark:text-blue-400">{icon}</span>
                </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-md mx-auto px-4 leading-relaxed">
                {subtitle}
            </p>
            
            {action && (
                <ActionButton
                    href={action.href}
                    onClick={action.onClick}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300 active:scale-95"
                >
                    <span aria-hidden="true" className="material-symbols-outlined text-[20px]">add_circle</span>
                    {action.label}
                </ActionButton>
            )}
        </div>
    );
}
