'use client';

import { useEffect } from 'react';

type BottomSheetProps = {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
};

export default function BottomSheet({ open, title, onClose, children, footer }: BottomSheetProps) {
    // Lock body scroll when open (mobile)
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // ESC closes
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return (
        <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
            {/* Overlay */}
            <div
                className={`absolute inset-0 bg-slate-950/45 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className={[
                    'absolute left-0 right-0 bottom-0',
                    'bg-surface-light dark:bg-background-dark',
                    'rounded-t-[28px] border-t border-slate-200 dark:border-white/10',
                    'shadow-2xl',
                    'transition-transform duration-300 ease-out',
                    open ? 'translate-y-0' : 'translate-y-full',
                ].join(' ')}
                style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
                }}
            >
                {/* Header */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-10 rounded-full bg-gray-200 dark:bg-white/10 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="touch-target rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15 flex items-center justify-center"
                        aria-label="إغلاق"
                    >
                        <span aria-hidden="true" className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 pb-4 max-h-[min(72vh,42rem)] overflow-auto overscroll-contain">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="px-4 pt-3 border-t border-slate-200 dark:border-white/10 bg-surface-light/90 dark:bg-background-dark/90 backdrop-blur">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
