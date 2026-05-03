'use client';

import BottomSheet from './BottomSheet';

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

const OPTIONS: { value: SortOption; label: string; icon: string }[] = [
    { value: 'newest', label: 'الأحدث', icon: 'schedule' },
    { value: 'price_asc', label: 'الأقل سعرًا', icon: 'south' },
    { value: 'price_desc', label: 'الأعلى سعرًا', icon: 'north' },
];

export default function SortSheet({
    open,
    onClose,
    value,
    onChange,
}: {
    open: boolean;
    onClose: () => void;
    value: SortOption;
    onChange: (v: SortOption) => void;
}) {
    return (
        <BottomSheet
            open={open}
            title="ترتيب النتائج"
            onClose={onClose}
            footer={
                <button
                    onClick={onClose}
                    className="w-full h-12 rounded-2xl bg-primary text-white font-bold"
                >
                    تم
                </button>
            }
        >
            <div className="space-y-2">
                {OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={[
                            'w-full p-4 rounded-2xl border flex items-center justify-between',
                            value === opt.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100',
                        ].join(' ')}
                        aria-pressed={value === opt.value}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined" aria-hidden="true">{opt.icon}</span>
                            <span className="font-semibold">{opt.label}</span>
                        </div>
                        {value === opt.value && <span className="material-symbols-outlined" aria-hidden="true">check</span>}
                    </button>
                ))}
            </div>
        </BottomSheet>
    );
}
