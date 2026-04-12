'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabaseService } from '@/services/supabaseService';

const navItems = [
    { href: '/admin', icon: 'dashboard', label: 'نظرة عامة' },
    { href: '/admin/properties', icon: 'real_estate_agent', label: 'العقارات', badgeKey: 'pendingProperties' },
    { href: '/admin/bookings', icon: 'book_online', label: 'الحجوزات', badgeKey: 'pendingBookings' },
    { href: '/admin/payments', icon: 'receipt_long', label: 'المدفوعات', badgeKey: 'pendingPayments' },
    { href: '/admin/users', icon: 'group', label: 'المستخدمين' },
    { href: '/admin/settings', icon: 'settings', label: 'الإعدادات' },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [stats, setStats] = useState<Record<string, number>>({
        pendingProperties: 0,
        pendingBookings: 0,
        pendingPayments: 0,
    });

    // Hydrate collapsed state from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('adminSidebarCollapsed');
        if (stored) {
            setCollapsed(stored === 'true');
        }
        
        // Let's fire a quick fetch for badges
        const fetchBadges = async () => {
            try {
                // Since this runs on every page, we can lightly fetch the counts
                const [properties, payments] = await Promise.all([
                    supabaseService.getProperties({ status: 'pending' }).then(r => r.length),
                    supabaseService.getPaymentRequestsCount({ status: 'pending' })
                ]);
                setStats({
                    pendingProperties: properties,
                    pendingBookings: 0, // Mock booking requests metric
                    pendingPayments: payments,
                });
            } catch (err) {
                // Handle silently
            }
        };
        fetchBadges();
    }, []);

    const toggleSidebar = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('adminSidebarCollapsed', String(newState));
    };

    return (
        <aside className={`fixed right-0 top-0 h-screen bg-surface-light dark:bg-surface-darkDim border-l border-slate-200 dark:border-white/5 hidden lg:flex flex-col z-40 transition-all duration-300 shadow-soft ${collapsed ? 'w-20' : 'w-64'}`}>
            
            {/* Logo Area */}
            <div className="p-4 h-[72px] border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-glow flex-shrink-0">
                        <span className="material-symbols-rounded text-white text-sm">home</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white whitespace-nowrap">عقارات جمصة</span>
                </div>
                <button 
                    onClick={toggleSidebar}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                >
                    <span className="material-symbols-rounded text-[22px]">
                        {collapsed ? 'menu_open' : 'menu'}
                    </span>
                </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2 scrollbar-hide">
                <div className={`px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider transition-all duration-300 ${collapsed ? 'opacity-0 h-0 hidden' : 'opacity-100'}`}>
                    القائمة الرئيسية
                </div>

                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                    const badgeVal = item.badgeKey ? stats[item.badgeKey] : 0;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            className={`flex items-center rounded-xl transition-all duration-300 group relative
                                ${collapsed ? 'justify-center p-3 w-12 h-12 mx-auto' : 'px-4 py-3 w-full gap-3'}
                                ${isActive 
                                    ? 'bg-primary/10 text-primary dark:text-primary-light font-bold' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            {isActive && !collapsed && (
                                <span className="absolute right-0 top-[10%] bottom-[10%] w-1 bg-primary rounded-l-full shadow-glow"></span>
                            )}
                            <span className={`material-symbols-rounded transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110'}`}>
                                {item.icon}
                            </span>
                            
                            {!collapsed && <span className="truncate">{item.label}</span>}

                            {!collapsed && badgeVal > 0 && (
                                <span className="mr-auto w-6 h-6 rounded-full bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center">
                                    {badgeVal > 9 ? '+9' : badgeVal}
                                </span>
                            )}

                            {/* Tooltip for collapsed view */}
                            {collapsed && (
                                <div className="absolute right-full mr-4 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-soft font-medium">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout/Back Bottom */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5">
                <Link
                    href="/"
                    className={`flex items-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors group relative
                        ${collapsed ? 'justify-center p-3 w-12 h-12 mx-auto' : 'px-4 py-3 gap-3 w-full'}`}
                >
                    <span className="material-symbols-rounded group-hover:-translate-x-1 transition-transform">logout</span>
                    {!collapsed && <span className="font-medium">الرجوع للموقع</span>}
                    {collapsed && (
                        <div className="absolute right-full mr-4 px-3 py-2 bg-red-500 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                            خروج
                        </div>
                    )}
                </Link>
            </div>
        </aside>
    );
}
