'use client';

interface QuickRepliesProps {
    onSelect: (template: string) => void;
}

export function QuickReplies({ onSelect }: QuickRepliesProps) {
    const quickReplies = [
        { icon: 'calendar_today', text: 'متاح؟', template: 'هل الشقة متاحة في الفترة من [تاريخ] إلى [تاريخ]؟' },
        { icon: 'payments', text: 'آخر سعر؟', template: 'ما هو السعر النهائي شامل كل شيء؟' },
        { icon: 'location_on', text: 'الموقع', template: 'هل يمكنك إرسال الموقع الدقيق للعقار؟' },
        { icon: 'photo_camera', text: 'صور إضافية', template: 'هل يمكن إرسال صور إضافية للعقار؟' },
    ];

    return (
        <div className="px-4 pt-3 pb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {quickReplies.map((reply, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(reply.template)}
                        className="shrink-0 px-3 py-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors border border-gray-200 dark:border-zinc-700"
                    >
                        <span aria-hidden="true" className="material-symbols-outlined text-sm text-blue-500">{reply.icon}</span>
                        {reply.text}
                    </button>
                ))}
            </div>
        </div>
    );
}
