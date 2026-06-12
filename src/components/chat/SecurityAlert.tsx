export const SecurityAlert = () => {
    return (
        <div className="bg-blue-50/80 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/30 px-4 py-3">
            <div className="flex items-start gap-3 max-w-3xl mx-auto">
                <span aria-hidden="true" className="material-symbols-outlined text-primary mt-0.5">security</span>
                <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                    <strong>تنبيه أمان:</strong> يرجى إتمام جميع المدفوعات عبر التطبيق لضمان حقك وتجنب الاحتيال. لا تقم بتحويل أموال خارج المنصة.
                </p>
            </div>
        </div>
    );
};
