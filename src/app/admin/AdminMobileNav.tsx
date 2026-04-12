'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminRouteConfig } from './config';
import { useState } from 'react';

const mobileNavItems = [
    { href: '/admin', icon: 'dashboard', label: 'نظرة' },
    { href: '/admin/properties', icon: 'real_estate_agent', label: 'العقارات' },
    { href: 'fab', isFab: true }, // Placeholder for FAB
    { href: '/admin/payments', icon: 'receipt_long', label: 'المدفوعات' },
    { href: 'menu', icon: 'menu', label: 'القائمة' }, // Trigger mobile drawer
];

// Reusing same navItems array for mobile menu drawer logic
const menuDrawerItems = [
    { href: '/admin/bookings', icon: 'book_online', label: 'الحجوزات' },
    { href: '/admin/users', icon: 'group', label: 'المستخدمين' },
    { href: '/admin/settings', icon: 'settings', label: 'الإعدادات' },
];

export default function AdminMobileNav() {
    const pathname = usePathname();
    const router = useRouter();
    const config = getAdminRouteConfig(pathname);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleFabClick = () => {
        if (config.fabAction === 'search') {
            // Trigger focus on a .admin-search-input using DOM.
            // Since we implemented unified search in the header, 
            // a better behavior is to scroll to top or open header search.
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (config.fabAction === 'filter_pending') {
            // Usually the pages have a local state, but we can append a hash or query
            // However, the cleanest fallback is to just navigate to the page and let user interact.
            // A query parameter is the generic answer from the spec "switch to pending filter".
            const currentPath = window.location.pathname;
            router.push(`${currentPath}?status=pending`);
            return;
        }

        router.push(config.fabAction);
    };

    return (
        <>
            {/* The Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface-light/90 dark:bg-surface-darkDim/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 pb-safe shadow-bottom-nav">
                <div className="flex justify-between items-center h-16 px-2 relative">
                    {mobileNavItems.map((item, index) => {
                        if (item.isFab) {
                            // Render Dynamic Route-Driven FAB
                            return (
                                <div key="fab" className="flex-1 flex justify-center h-full">
                                    <div className="absolute -top-6">
                                        <button 
                                            onClick={handleFabClick}
                                            className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white shadow-glow hover:scale-105 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-primary/30"
                                        >
                                            <span className="material-symbols-rounded text-3xl font-light">
                                                {config.fabIcon}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        if (item.href === 'menu') {
                            return (
                                <button 
                                    key="menu"
                                    onClick={() => setIsMenuOpen(true)}
                                    className="flex-1 flex flex-col items-center justify-center h-full gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-rounded text-[24px]">menu</span>
                                    <span className="text-[10px] sm:text-xs font-semibold tracking-wide">القائمة</span>
                                </button>
                            );
                        }

                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex-1 flex flex-col items-center justify-center h-full gap-1 transition-all duration-300 relative ${
                                    isActive 
                                        ? 'text-primary dark:text-primary-light' 
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                {/* Indicator dot */}
                                {isActive && (
                                    <span className="absolute top-0 right-1/2 translate-x-1/2 w-8 h-1 bg-primary rounded-b-full"></span>
                                )}
                                <span className={`material-symbols-rounded text-[24px] transition-transform ${isActive ? 'filled scale-110 mb-1' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className="text-[10px] sm:text-xs font-semibold tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Mobile Off-Canvas Menu Drawer & Backdrop */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMenuOpen(false)}
                    ></div>
                    
                    {/* Drawer (Sliding from Right side typical for RTL) */}
                    <div className="absolute top-0 right-0 bottom-0 w-72 bg-surface-light dark:bg-surface-darkDim shadow-2xl flex flex-col animate-slide-in-right">
                        <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-white">القائمة الإضافية</span>
                            <button 
                                onClick={() => setIsMenuOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                            >
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {menuDrawerItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                                            isActive
                                                ? 'bg-primary/10 text-primary font-bold'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <span className={`material-symbols-rounded ${isActive ? 'filled' : ''}`}>
                                            {item.icon}
                                        </span>
                                        <span className="text-[15px]">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                        
                        <div className="p-4 border-t border-slate-200 dark:border-white/5">
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                <span className="material-symbols-rounded">logout</span>
                                <span>الرجوع للموقع</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
