export default function EmptyState() {
    return (
        <div className="w-full h-[40vh] flex flex-col items-center justify-center text-center p-8">
            <div className="
                w-24 h-24 rounded-full bg-gray-50/50 dark:bg-gray-800/30 
                flex items-center justify-center mb-6
                backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-700
            ">
                <span aria-hidden="true" className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">
                    notifications_none
                </span>
            </div>

            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                لا توجد إشعارات حاليًا
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                سنخبرك فور حدوث أي جديد، استمتع بوقتك الآن.
            </p>
        </div>
    );
}
