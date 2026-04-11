'use client';

import { useEffect, useState } from 'react';
import { supabaseService, PropertyRow } from '@/services/supabaseService';
import { GlassCard } from '@/components/ui/glass';
import { PRICE_UNIT_AR } from '@/types';

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
            icon: 'pending_actions',
            color: 'from-amber-500 to-orange-500',
            href: '/admin/properties',
        },
        {
            title: 'إجمالي العقارات',
            value: stats.totalProperties,
            icon: 'home_work',
            color: 'from-blue-500 to-cyan-500',
            href: '/admin/properties',
        },
        {
            title: 'طلبات دفع معلقة',
            value: stats.pendingPayments,
            icon: 'payments',
            color: 'from-green-500 to-emerald-500',
            href: '/admin/payments',
        },
        {
            title: 'المستخدمين',
            value: stats.totalUsers,
            icon: 'group',
            color: 'from-purple-500 to-pink-500',
            href: '/admin/users',
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <a key={i} href={stat.href}>
                        <GlassCard variant="elevated" padding="lg" className="hover:scale-[1.02] transition-transform cursor-pointer">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
                                <span className="material-symbols-outlined text-white text-2xl">{stat.icon}</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.title}</p>
                        </GlassCard>
                    </a>
                ))}
            </div>

            {/* Recent Pending Properties */}
            <GlassCard variant="elevated" padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">أحدث العقارات المعلقة</h2>
                    <a href="/admin/properties" className="text-sm text-primary hover:underline">عرض الكل</a>
                </div>

                {recentProperties.length > 0 ? (
                    <div className="space-y-3">
                        {recentProperties.map(prop => (
                            <div key={prop.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/50 dark:bg-white/5">
                                <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                    {prop.images[0] ? (
                                        <img src={prop.images[0]} alt={`صورة ${prop.title}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-gray-400">image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{prop.title}</h3>
                                    <p className="text-sm text-gray-500">{prop.price} ج.م / {PRICE_UNIT_AR[prop.price_unit as keyof typeof PRICE_UNIT_AR] ?? prop.price_unit}</p>
                                </div>
                                <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-medium">
                                    معلق
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 py-8">لا توجد عقارات معلقة</p>
                )}
            </GlassCard>
        </div>
    );
}
