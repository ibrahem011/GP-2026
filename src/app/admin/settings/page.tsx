'use client';

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header Area */}
            <div className="bg-white dark:bg-surface-darkDim p-8 rounded-[24px] shadow-soft border border-slate-100 dark:border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center shadow-inner border border-white dark:border-slate-800 flex-shrink-0">
                        <span className="material-symbols-rounded text-[40px] text-slate-400 dark:text-slate-500">settings_suggest</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">إعدادات النظام (إصدار تجريبي)</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                            هذه الواجهة مخصصة للإعدادات المتقدمة لمنصة عقارات جمصة. حالياً، يتم إدارة صلاحيات المستخدمين والمدفوعات من خلال الصفحات المخصصة لها.
                        </p>
                    </div>
                </div>
            </div>

            {/* Placeholders for Future Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* General Settings */}
                <div className="bg-white dark:bg-surface-darkDim p-6 rounded-[24px] shadow-soft border border-slate-100 dark:border-white/5 opacity-70 grayscale-[30%] pointer-events-none transition-all hover:grayscale-0 hover:opacity-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <span className="material-symbols-rounded">tune</span>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">الإعدادات العامة</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">رسوم فك الحظر العقاري</h4>
                                <p className="text-xs text-slate-500 mt-1">القيمة الافتراضية 50 ج.م</p>
                            </div>
                            <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg text-xs font-bold">قريباً</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">الحد الأقصى للصور العقارية</h4>
                                <p className="text-xs text-slate-500 mt-1">افتراضياً 6 صور للعقار</p>
                            </div>
                            <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg text-xs font-bold">قريباً</span>
                        </div>
                    </div>
                </div>

                {/* Notifications & Maintenance */}
                <div className="bg-white dark:bg-surface-darkDim p-6 rounded-[24px] shadow-soft border border-slate-100 dark:border-white/5 opacity-70 grayscale-[30%] pointer-events-none transition-all hover:grayscale-0 hover:opacity-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <span className="material-symbols-rounded">notifications_active</span>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">التنبيهات والصيانة</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">وضع الصيانة (Maintenance Mode)</h4>
                                <p className="text-xs text-slate-500 mt-1">إيقاف الموقع مؤقتاً للتحديثات</p>
                            </div>
                            <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full relative">
                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">إشعار عام للكل</h4>
                                <p className="text-xs text-slate-500 mt-1">إرسال رسالة لكل مسجلين النظام</p>
                            </div>
                            <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg text-xs font-bold">قريباً</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
