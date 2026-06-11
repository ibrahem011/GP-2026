'use client';

import { useEffect, useRef, useState } from 'react';
import type { Notification } from '@/types';
import Link from 'next/link';

type Props = {
    open: boolean;
    onClose: () => void;
    notifications: Notification[];
    unreadCount: number;
    onNotificationClick: (n: Notification) => void;
    onMarkAllAsRead: () => void;
    getNotificationIcon: (type: Notification['type']) => string;
    getNotificationColor: (type: Notification['type']) => string;
};

const TYPE_CONFIG = {
    success: { icon: 'check_circle', bg: 'bg-green-500/10', color: 'text-green-500' },
    warning: { icon: 'warning_amber', bg: 'bg-amber-500/10', color: 'text-amber-500' },
    error: { icon: 'cancel', bg: 'bg-red-500/10', color: 'text-red-500' },
    info: { icon: 'info', bg: 'bg-blue-500/10', color: 'text-blue-500' },
} as const;

function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
    return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}

export default function NotificationsPopover({
    open, onClose, notifications, unreadCount,
    onNotificationClick, onMarkAllAsRead,
}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        const onMouse = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) {
                const isTrigger = (e.target as Element).closest('[data-notifications-trigger]');
                if (!isTrigger) onClose();
            }
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onMouse);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onMouse);
        };
    }, [open, onClose]);

    if (!mounted || !open) return null;

    return (
        <>
            <style>{`
                @keyframes npop-in {
                    from { opacity: 0; transform: translateY(-12px) scale(0.95); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .np-panel {
                    animation: npop-in 0.2s cubic-bezier(0.2,1,0.3,1) forwards;
                }
            `}</style>

            <div
                ref={ref}
                className="np-panel absolute top-full left-0 mt-3 w-[400px] z-50 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-2xl">notifications</span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">الإشعارات</h3>
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                                {unreadCount} جديد
                            </span>
                        )}
                    </div>

                    <button aria-label="إغلاق" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors">
                        <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
                    </button>
                </div>

                {/* List */}
                <div className="max-h-[460px] overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                            <span className="material-symbols-outlined text-5xl mb-4">notifications_off</span>
                            <p className="font-bold">لا توجد إشعارات حالياً</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {notifications.map((n) => {
                                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
                                return (
                                    <button
                                        key={n.id}
                                        className={`w-full flex items-start gap-4 p-5 text-right transition-colors ${n.isRead ? 'bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.02]' : 'bg-primary/[0.03] dark:bg-primary/[0.05] hover:bg-primary/[0.06]'}`}
                                        onClick={() => onNotificationClick(n)}
                                    >
                                        <div className={`shrink-0 size-11 rounded-2xl ${cfg.bg} flex items-center justify-center border border-white/10`}>
                                            <span className={`material-symbols-outlined text-2xl ${cfg.color}`}>{cfg.icon}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <p className={`text-base truncate ${n.isRead ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-900 dark:text-white font-black'}`}>
                                                    {n.title}
                                                </p>
                                                {!n.isRead && (
                                                    <span className="size-2.5 bg-primary rounded-full ring-4 ring-primary/20 shrink-0 mt-2 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2">
                                                {n.message}
                                            </p>
                                            <span className="text-[11px] font-bold text-gray-400 tracking-wider">
                                                {formatTime(n.createdAt)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-black/20 text-center flex items-center justify-between gap-4">
                    {unreadCount > 0 && (
                        <button onClick={onMarkAllAsRead} className="text-sm font-bold text-primary hover:underline px-2">
                            تحديد الكل كمقروء
                        </button>
                    )}
                    <Link href="/notifications" className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <span>كل الإشعارات</span>
                        <span className="material-symbols-outlined text-base">arrow_back_ios</span>
                    </Link>
                </div>
            </div>
        </>
    );
}
