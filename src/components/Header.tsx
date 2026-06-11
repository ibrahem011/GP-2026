'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount } from '@/lib/storage';
import type { Notification } from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import NotificationsSheet from './notifications/NotificationsSheet';
import NotificationsPopover from './notifications/NotificationsPopover';

export default function Header() {
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isScrolledState, setIsScrolledState] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const isHome = pathname === '/';
    const isScrolled = isScrolledState || !isHome;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolledState(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        // Initial check
        const frame = requestAnimationFrame(handleScroll);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (user) {
            const userNotifications = getNotifications(user.id);
            queueMicrotask(() => {
                setNotifications(userNotifications);
                setUnreadCount(getUnreadNotificationCount(user.id));
            });
        }
    }, [user]);

    // Outside click logic is handled within the components or selectively here if needed.
    // However, to keep it clean and match the desired behavior, we use the specific components.
    // Removed old handleClickOutside from here as the components handle their own closing logic better.

    const handleNotificationClick = (notification: Notification) => {
        markNotificationAsRead(notification.id);
        if (user) {
            setNotifications(getNotifications(user.id));
            setUnreadCount(getUnreadNotificationCount(user.id));
        }
        setShowNotifications(false);

        if (notification.link) {
            window.location.href = notification.link;
        }
    };

    const handleMarkAllAsRead = () => {
        if (user) {
            markAllNotificationsAsRead(user.id);
            setNotifications(getNotifications(user.id));
            setUnreadCount(0);
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return 'check_circle';
            case 'warning':
                return 'warning';
            case 'error':
                return 'error';
            default:
                return 'info';
        }
    };

    const getNotificationColor = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return 'text-green-400';
            case 'warning':
                return 'text-yellow-400';
            case 'error':
                return 'text-red-400';
            default:
                return 'text-blue-400';
        }
    };

    return (
        <header className={`w-full transition-all duration-300 py-3 ${isScrolled ? "bg-surface-light/92 dark:bg-surface-dark/92 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-white/10" : "bg-transparent md:bg-transparent bg-surface-light/85 dark:bg-background-dark/80"}`}>
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 sm:px-6 relative gap-3">
                {/* Right Side (Brand) */}
                <div className="flex items-center">
                    <Link href="/" className="group flex min-w-0 items-center gap-2 rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/60">
                        <div className="size-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg transition-transform group-hover:scale-105 shrink-0">ع</div>
                        <span className={`max-w-[8.5rem] truncate text-sm font-black transition-colors sm:max-w-none sm:text-base md:text-xl ${isScrolled ? 'text-gray-900 dark:text-white group-hover:text-primary' : 'text-gray-900 dark:text-white md:text-white drop-shadow-md md:group-hover:text-white/90'}`}>عقارات جمصة</span>
                    </Link>
                </div>

                {/* Center (Desktop Nav Links) */}
                <nav className="hidden md:flex items-center justify-center gap-6 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <Link href="/" className={`font-medium transition-colors hover:text-primary ${pathname === '/' ? (isScrolled ? 'text-primary underline underline-offset-4 decoration-2' : 'text-white underline underline-offset-4 decoration-2 drop-shadow-md') : (isScrolled ? 'text-gray-700 dark:text-gray-300' : 'text-white/90 drop-shadow-md')}`}>الرئيسية</Link>
                    <Link href="/favorites" className={`font-medium transition-colors hover:text-primary ${pathname === '/favorites' ? (isScrolled ? 'text-primary underline underline-offset-4 decoration-2' : 'text-white underline underline-offset-4 decoration-2 drop-shadow-md') : (isScrolled ? 'text-gray-700 dark:text-gray-300' : 'text-white/90 drop-shadow-md')}`}>المفضلة</Link>
                    <Link href="/bookings" className={`font-medium transition-colors hover:text-primary ${pathname === '/bookings' ? (isScrolled ? 'text-primary underline underline-offset-4 decoration-2' : 'text-white underline underline-offset-4 decoration-2 drop-shadow-md') : (isScrolled ? 'text-gray-700 dark:text-gray-300' : 'text-white/90 drop-shadow-md')}`}>حجوزاتي</Link>
                    <Link href="/profile" className={`font-medium transition-colors hover:text-primary ${pathname === '/profile' ? (isScrolled ? 'text-primary underline underline-offset-4 decoration-2' : 'text-white underline underline-offset-4 decoration-2 drop-shadow-md') : (isScrolled ? 'text-gray-700 dark:text-gray-300' : 'text-white/90 drop-shadow-md')}`}>حسابي</Link>
                </nav>

                {/* Left Side (Actions) */}
                <div className="flex items-center gap-3 lg:gap-4 shrink-0">

                    {/* User Profile / Login */}
                    {isAuthenticated && user ? (
                        <div className="flex items-center gap-3">
                            {/* Notification Button */}
                            <div className="relative flex items-center" ref={dropdownRef}>
                                <button
                                    aria-label="الإشعارات"
                                    data-notifications-trigger="true"
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className={`relative flex touch-target items-center justify-center rounded-full shadow-sm border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/60 ${isScrolled
                                        ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300'
                                        : 'bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40'}`}
                                >
                                    <span className="material-symbols-outlined text-[24px] pointer-events-none" aria-hidden="true">
                                        notifications
                                    </span>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 left-1.5 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm animate-pulse"></span>
                                    )}
                                </button>

                                {/* Notifications Component Rendered based on device width */}
                                {isDesktop ? (
                                        <NotificationsPopover
                                            open={showNotifications}
                                            onClose={() => setShowNotifications(false)}
                                            notifications={notifications}
                                            unreadCount={unreadCount}
                                            onNotificationClick={handleNotificationClick}
                                            onMarkAllAsRead={handleMarkAllAsRead}
                                            getNotificationIcon={getNotificationIcon}
                                            getNotificationColor={getNotificationColor}
                                        />
                                    ) : (
                                        <NotificationsSheet
                                            open={showNotifications}
                                            onClose={() => setShowNotifications(false)}
                                            notifications={notifications}
                                            unreadCount={unreadCount}
                                            onNotificationClick={handleNotificationClick}
                                            onMarkAllAsRead={handleMarkAllAsRead}
                                            getNotificationIcon={getNotificationIcon}
                                            getNotificationColor={getNotificationColor}
                                        />
                                    )}
                            </div>

                            {/* User Menu */}
                            <Link href="/profile" className="group ms-1 hidden items-center gap-2 rounded-full focus-visible:ring-2 focus-visible:ring-primary/60 sm:flex lg:ms-2">
                                <div className="relative">
                                    <div className="bg-cover bg-center rounded-full size-10 border-2 border-primary/20 bg-gray-100 flex items-center justify-center overflow-hidden">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-gray-500">{user.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 left-0 size-3 bg-green-500 rounded-full border-2 border-white dark:border-background-dark"></div>
                                </div>
                            </Link>

                            <Link
                                href="/profile"
                                aria-label="حسابي"
                                title="حسابي"
                                className={`touch-target flex items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-primary/60 sm:hidden ${isScrolled
                                    ? 'border-gray-100 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-primary dark:border-white/10 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/20'
                                    : 'border-white/30 bg-white/20 text-white backdrop-blur-md hover:bg-white/40'}`}
                            >
                                <span className="material-symbols-outlined text-[22px]">person</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/auth?mode=login" className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-primary/60 sm:px-4 ${isScrolled ? 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'}`}>
                                تسجيل الدخول
                            </Link>
                            <Link href="/auth?mode=signup" className="hidden min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/60 sm:inline-flex">
                                إنشاء حساب
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
