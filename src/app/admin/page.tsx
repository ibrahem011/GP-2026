'use client';

import { useEffect, useState } from 'react';
import { supabaseService, PropertyRow } from '@/services/supabaseService';
import { PRICE_UNIT_AR } from '@/types';
import Link from 'next/link';

interface Stats {
    pendingProperties: number;
    totalProperties: number;
    pendingPayments: number;
    totalUsers: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        pendingProperties: 0,
        totalProperties: 0,
        pendingPayments: 0,
        totalUsers: 0,
    });
    const [recentProperties, setRecentProperties] = useState<PropertyRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [pending, pendingPropertiesCount, totalPropertiesCount, pendingPaymentsCount, usersCount] = await Promise.all([
                supabaseService.getProperties({ status: 'pending', limit: 5 }), // We only need up to 5 for recent properties
                supabaseService.getPropertiesCount({ status: 'pending' }),
                supabaseService.getPropertiesCount(),
                supabaseService.getPaymentRequestsCount({ status: 'pending' }),
                supabaseService.getProfilesCount(),
            ]);

            setStats({
                pendingProperties: pendingPropertiesCount,
                totalProperties: totalPropertiesCount,
                pendingPayments: pendingPaymentsCount,
                totalUsers: usersCount,
            });

            setRecentProperties(pending);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'عقارات معلقة',
            value: stats.pendingProperties,
            icon: 'real_estate_agent',
            color: 'from-amber-500 to-orange-500',
            bgGlow: 'bg-amber-500/10',
            href: '/admin/properties?status=pending',
        },
        {
            title: 'إجمالي العقارات',
            value: stats.totalProperties,
            icon: 'apartment',
            color: 'from-blue-500 to-cyan-500',
            bgGlow: 'bg-blue-500/10',
            href: '/admin/properties',
        },
        {
            title: 'طلبات دفع معلقة',
            value: stats.pendingPayments,
            icon: 'receipt_long',
            color: 'from-green-500 to-emerald-500',
            bgGlow: 'bg-green-500/10',
            href: '/admin/payments?status=pending',
        },
        {
            title: 'المستخدمين',
            value: stats.totalUsers,
            icon: 'group',
            color: 'from-purple-500 to-pink-500',
            bgGlow: 'bg-purple-500/10',
            href: '/admin/users',
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[24px] animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            
            {/* Quick Actions Row */}
            <div className="flex overflow-x-auto pb-4 -mb-4 gap-3 scrollbar-hide">
                <Link href="/add-property" className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-surface-darkDim shadow-soft border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-primary-light hover:border-primary/20 transition-all font-medium whitespace-nowrap">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-rounded text-[20px]">add</span>
                    </div>
                    إضافة عقار
                </Link>
                <Link href="/admin/users?q=" className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-surface-darkDim shadow-soft border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-primary-light hover:border-primary/20 transition-all font-medium whitespace-nowrap">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <span className="material-symbols-rounded text-[20px]">search</span>
                    </div>
                    البحث عن مستخدم
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <Link key={i} href={stat.href} className="group outline-none">
                        <div className={`relative p-6 rounded-[24px] bg-white dark:bg-surface-darkDim shadow-soft border border-slate-100 dark:border-white/5 overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] group-focus:ring-2 group-focus:ring-primary`}>
                            {/* Accent Glow Layer */}
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] -mr-16 -mt-16 rounded-full transition-opacity opacity-50 group-hover:opacity-100 pointer-events-none ${stat.bgGlow}`}></div>
                            
                            <div className="relative z-10 flex flex-col pt-2">
                                <div className={`w-12 h-12 rounded-[16px] bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg text-white transform transition-transform group-hover:scale-110`}>
                                    <span className="material-symbols-rounded text-[24px]">{stat.icon}</span>
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</h3>
                                <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1 group-hover:text-primary transition-colors">{stat.value}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Pending Properties - Table/Card List */}
            <div className="bg-white dark:bg-surface-darkDim rounded-[24px] shadow-soft border border-slate-100 dark:border-white/5 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <span className="material-symbols-rounded">pending_actions</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-none">أحدث العقارات المعلقة</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">عقارات في انتظار المراجعة والاعتماد</p>
                        </div>
                    </div>
                    <Link href="/admin/properties?status=pending" className="hidden sm:flex items-center gap-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        عرض الكل
                        <span className="material-symbols-rounded text-[18px]">chevron_left</span>
                    </Link>
                </div>

                <div className="p-0">
                    {recentProperties.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {recentProperties.map(prop => (
                                <div key={prop.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                    <div className="w-20 h-20 rounded-[16px] bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 relative">
                                        {prop.images[0] ? (
                                            <img src={prop.images[0]} alt={`صورة`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="material-symbols-rounded text-slate-300 dark:text-slate-600 text-[32px]">image</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-[16px]"></div>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h3 className="font-bold text-slate-800 dark:text-white truncate text-base">{prop.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1">
                                            <span className="material-symbols-rounded text-[16px]">location_on</span>
                                            {prop.area || prop.address || 'جمصة'}
                                        </p>
                                    </div>
                                    <div className="hidden sm:flex flex-col items-end justify-center pr-4">
                                        <span className="text-sm font-bold text-primary dark:text-primary-light">
                                            {prop.price} ج.م
                                        </span>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            لكل {PRICE_UNIT_AR[prop.price_unit as keyof typeof PRICE_UNIT_AR] ?? prop.price_unit}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center pl-2">
                                        <Link href={`/admin/properties`} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-white hover:text-primary hover:shadow-soft dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                                            <span className="material-symbols-rounded">chevron_left</span>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center mb-4">
                                <span className="material-symbols-rounded text-[32px] text-slate-300 dark:text-slate-600">check_circle</span>
                            </div>
                            <h3 className="text-slate-800 dark:text-white font-bold">لا توجد عقارات جديدة معلقة</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm max-w-[250px]">جميع العقارات الحالية تمت مراجعتها وليس هناك طلبات إضافة جديدة.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
