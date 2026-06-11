'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Notification } from '@/types';

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
    success: { icon: 'check_circle', bg: 'bg-green-500/10', color: 'text-green-500', glow: 'shadow-green-500/20' },
    warning: { icon: 'warning_amber', bg: 'bg-amber-500/10', color: 'text-amber-500', glow: 'shadow-amber-500/20' },
    error: { icon: 'cancel', bg: 'bg-red-500/10', color: 'text-red-500', glow: 'shadow-red-500/20' },
    info: { icon: 'info', bg: 'bg-blue-500/10', color: 'text-blue-500', glow: 'shadow-blue-500/20' },
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

export default function NotificationsSheet({
    open, onClose, notifications, unreadCount,
    onNotificationClick, onMarkAllAsRead,
}: Props) {
    const startY = useRef(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!mounted) return null;

    const content = (
        <>
            <style>{`
                @keyframes ns-bd  { from{opacity:0} to{opacity:1} }
                @keyframes ns-up  { from{transform:translateY(100%)} to{transform:translateY(0)} }
                @keyframes ns-row { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                .ns-bd   { animation: ns-bd  0.2s ease forwards }
                .ns-up   { animation: ns-up  0.3s cubic-bezier(0.2,1,0.3,1) forwards }
                .ns-row  { animation: ns-row 0.25s cubic-bezier(0.2,1,0.3,1) both }
            `}</style>

            <div
                className={`fixed inset-0 z-[1000] ${open ? 'visible' : 'invisible'}`}
                style={{ pointerEvents: open ? 'auto' : 'none' }}
                dir="rtl"
            >
                {/* Backdrop */}
                <div
                    className={`${open ? 'ns-bd' : 'hidden'} absolute inset-0 bg-black/50 backdrop-blur-[2px]`}
                    onClick={onClose}
                />

                {/* Sheet */}
                <div
                    className={`${open ? 'ns-up' : ''} absolute bottom-0 left-0 right-0 max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-white/10 rounded-t-[32px] shadow-2xl transition-all duration-300`}
                    onTouchStart={e => { startY.current = e.touches[0].clientY; }}
                    onTouchEnd={e => { if (e.changedTouches[0].clientY - startY.current > 70) onClose(); }}
                    style={{
                        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                    }}
                >
                    {/* Drag Handle */}
                    <div className="flex justify-center py-4 shrink-0">
                        <div className="w-12 h-1.5 rounded-full bg-gray-200 dark:bg-white/10" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100 dark:border-white/5 shrink-0">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">الإشعارات</h3>
                            {unreadCount > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                                    {unreadCount}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {unreadCount > 0 && (
                                <button onClick={onMarkAllAsRead} className="text-sm font-bold text-primary hover:opacity-80">
                                    قراءة الكل
                                </button>
                            )}
                            <button aria-label="إغلاق" onClick={onClose} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                                <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto px-4 py-2 scroll-smooth overscroll-contain">
                        {notifications.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                                <div className="size-20 rounded-3xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-4xl">notifications_off</span>
                                </div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">لا توجد إشعارات</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">ستصلك إشعارات عند وجود نشاط جديد</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {notifications.map((n, i) => {
                                    const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
                                    return (
                                        <button
                                            key={n.id}
                                            className={`ns-row w-full flex items-start gap-4 p-4 rounded-2xl transition-all ${n.isRead ? 'hover:bg-gray-50 dark:hover:bg-white/5' : 'bg-primary/[0.03] dark:bg-primary/[0.05] border border-primary/10 hover:bg-primary/[0.06]'}`}
                                            onClick={() => onNotificationClick(n)}
                                            style={{ animationDelay: `${i * 0.05}s` }}
                                        >
                                            <div className={`shrink-0 size-12 rounded-xl ${cfg.bg} flex items-center justify-center border border-white/10`}>
                                                <span className={`material-symbols-outlined text-2xl ${cfg.color}`}>{cfg.icon}</span>
                                            </div>

                                            <div className="flex-1 min-w-0 text-right">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <p className={`text-base truncate ${n.isRead ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-900 dark:text-white font-black'}`}>
                                                        {n.title}
                                                    </p>
                                                    {!n.isRead && (
                                                        <span className="size-2 bg-primary rounded-full ring-4 ring-primary/20 shrink-0 mt-2" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2 line-clamp-2">
                                                    {n.message}
                                                </p>
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                                    {formatTime(n.createdAt)}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* View All link */}
                    {notifications.length > 0 && (
                        <div className="p-6 border-t border-gray-100 dark:border-white/5 shrink-0 flex justify-center">
                            <Link href="/notifications" className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
                                <span>عرض جميع التنبيهات</span>
                                <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
}

import Link from 'next/link';
