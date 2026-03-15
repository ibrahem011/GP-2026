'use client';
import { useState } from 'react';
import Link from 'next/link';
import MyPropertyCard from '@/components/MyPropertyCard';
import PropertyCardSkeleton from '@/components/PropertyCardSkeleton';
import EmptyState from '@/components/EmptyState';
import StatCard from '@/components/StatCard';
import FilterChip from '@/components/FilterChip';
import { useAuth } from '@/context/AuthContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useToast } from '@/hooks/useToast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PropertyCategory, PropertyStatus, CATEGORY_AR } from '@/types';

export default function MyPropertiesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { properties, loading, error, deleteProperty, updateStatus, refresh, deletingId } =
        useMyProperties(user?.id, {
            onSuccess: (msg) => toast.success(msg),
            onError: (msg) => toast.error(msg),
        });

    const [filter, setFilter] = useState<PropertyStatus | PropertyCategory | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'price_high' | 'price_low'>('newest');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const handleDelete = async (id: string) => {
        await deleteProperty(id);
    };

    const handleStatusChange = async (id: string, newStatus: PropertyStatus) => {
        await updateStatus(id, newStatus);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black pb-24">
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-5xl text-gray-400">lock</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">يجب تسجيل الدخول</h1>
                    <p className="text-gray-500 mb-8 max-w-sm">
                        لإدارة عقاراتك، يرجى تسجيل الدخول.
                    </p>
                    <Link
                        href="/auth"
                        className="bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
                    >
                        تسجيل الدخول
                    </Link>
                </div>
            </div>
        );
    }

    const uniqueCategories = Array.from(new Set(properties.map((p) => p.category)));
    const availableCount = properties.filter((p) => p.status === 'available').length;
    const rentedCount = properties.filter((p) => p.status === 'rented').length;
    const totalViews = properties.reduce((sum, p) => sum + p.viewsCount, 0);

    const displayedProperties = (() => {
        let list = properties;
        if (filter) {
            if (['available', 'rented'].includes(filter as string)) {
                list = list.filter((p) => p.status === filter);
            } else {
                list = list.filter((p) => p.category === filter);
            }
        }
        return [...list].sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'views':
                    return b.viewsCount - a.viewsCount;
                case 'price_high':
                    return b.price - a.price;
                case 'price_low':
                    return a.price - b.price;
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
    })();

    const isFilterEmpty = filter !== null && displayedProperties.length === 0;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 dark:bg-black pb-24">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="sm:hidden flex items-center justify-between mb-6 gap-3">
                        <button
                            onClick={() => window.history.back()}
                            className="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-gray-500 hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                        <nav className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
                            <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                            <Link href="/profile" className="hover:text-primary transition-colors text-gray-600 dark:text-gray-300">الحالي</Link>
                        </nav>
                    </div>

                    {/* Sticky Floating Header */}
                    <div className="sticky top-4 z-40 flex items-center justify-between mb-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-5 py-4 rounded-3xl shadow-sm border border-white/20 dark:border-white/5 transition-all">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">عقاراتي</h1>
                            <span className="bg-primary/10 text-primary text-sm font-black px-3 py-1 rounded-full border border-primary/20 shadow-inner">
                                {properties.length}
                            </span>
                        </div>
                        <div className="hidden sm:flex items-center gap-3">
                            <Link
                                href="/"
                                className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-500 hover:text-primary hover:scale-105 active:scale-95 transition-all"
                                title="الرئيسية"
                            >
                                <span className="material-symbols-outlined text-[20px]">home</span>
                            </Link>
                            <button
                                onClick={() => window.history.back()}
                                className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-500 hover:text-primary hover:scale-105 active:scale-95 transition-all"
                                title="رجوع"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </button>
                            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1"></div>
                            <Link
                                href="/add-property"
                                className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                <span>إضافة عقار</span>
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map((i) => (
                                <PropertyCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center py-16 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-900/20">
                            <span className="material-symbols-outlined text-4xl text-red-400 mb-3">cloud_off</span>
                            <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">تعذّر تحميل العقارات</p>
                            <p className="text-sm text-gray-400 mb-5">{error}</p>
                            <button
                                onClick={refresh}
                                className="flex items-center gap-2 px-5 py-2 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                                إعادة المحاولة
                            </button>
                        </div>
                    ) : properties.length === 0 ? (
                        <EmptyState
                            icon="home_work"
                            title="لا توجد عقارات مضافة"
                            subtitle="لم تقم بإضافة أي عقارات حتى الآن. ابدأ بإضافة عقارك الأول!"
                            action={{ label: 'إضافة عقار جديد', href: '/add-property' }}
                        />
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <StatCard label="إجمالي العقارات" value={properties.length} icon="home_work" color="blue" />
                                <StatCard label="متاح للإيجار" value={availableCount} icon="check_circle" color="green" />
                                <StatCard label="إجمالي المشاهدات" value={totalViews} icon="visibility" color="purple" />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar flex-1">
                                    <FilterChip label="الكل" count={properties.length} active={!filter} onClick={() => setFilter(null)} />
                                    <FilterChip label="متاح" count={availableCount} active={filter === 'available'} onClick={() => setFilter('available')} />
                                    <FilterChip label="مؤجر" count={rentedCount} active={filter === 'rented'} onClick={() => setFilter('rented')} />
                                    {uniqueCategories.map((cat) => (
                                        <FilterChip key={cat} label={CATEGORY_AR[cat]} active={filter === cat} onClick={() => setFilter(cat)} />
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center shrink-0">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                        className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 text-sm rounded-xl px-3 py-1.5 border-none outline-none cursor-pointer"
                                    >
                                        <option value="newest">الأحدث أولاً</option>
                                        <option value="oldest">الأقدم أولاً</option>
                                        <option value="views">الأكثر مشاهدة</option>
                                        <option value="price_high">السعر: الأعلى</option>
                                        <option value="price_low">السعر: الأقل</option>
                                    </select>
                                    <div className="flex bg-gray-100 dark:bg-white/5 rounded-2xl p-1.5 shadow-inner">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={'p-2 rounded-xl transition-all duration-300 ' + (viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300')}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">view_list</span>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={'p-2 rounded-xl transition-all duration-300 ' + (viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300')}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">grid_view</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {isFilterEmpty ? (
                                <EmptyState
                                    icon="filter_list_off"
                                    title="لا توجد نتائج"
                                    subtitle="لا توجد عقارات تطابق الفلتر المحدد"
                                    action={{ label: 'مسح الفلتر', onClick: () => setFilter(null) }}
                                />
                            ) : (
                                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'flex flex-col gap-4'}>
                                    {displayedProperties.map((property) => (
                                        <MyPropertyCard
                                            key={property.id}
                                            property={property}
                                            onDelete={handleDelete}
                                            onStatusChange={handleStatusChange}
                                            isDeleting={deletingId === property.id}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <Link
                    href="/add-property"
                    className="fixed bottom-24 left-4 z-50 sm:hidden flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined text-[28px]">add</span>
                </Link>
            </div>
        </ProtectedRoute>
    );
}
