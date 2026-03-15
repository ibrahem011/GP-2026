'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import MyPropertyCard from '@/components/MyPropertyCard';
import PropertyCardSkeleton from '@/components/PropertyCardSkeleton';
import EmptyState from '@/components/EmptyState';
import StatCard from '@/components/StatCard';
import FilterChip from '@/components/FilterChip';
import { PropertyFilters } from '@/components/PropertyFilters';
import { useAuth } from '@/context/AuthContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { usePropertyFilters } from '@/hooks/usePropertyFilters';
import { useToast } from '@/hooks/useToast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PropertyStatus, CATEGORY_AR } from '@/types';

export default function MyPropertiesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { properties, loading, error, deleteProperty, updateStatus, refresh, deletingId } =
        useMyProperties(user?.id, {
            onSuccess: (msg) => toast.success(msg),
            onError: (msg) => toast.error(msg),
        });

    const {
        filter,
        setFilter,
        sortBy,
        setSortBy,
        filteredProperties: displayedProperties,
        availableCount,
        rentedCount,
        totalViews,
        uniqueCategories,
        isFilterEmpty,
    } = usePropertyFilters(properties);

    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [propertyToDelete, setPropertyToDelete] = useState<{ id: string, title: string } | null>(null);

    const handleDeleteClick = useCallback((id: string) => {
        const property = properties.find(p => p.id === id);
        if (property) {
            setPropertyToDelete({ id, title: property.title });
        }
    }, [properties]);

    const handleConfirmDelete = async () => {
        if (propertyToDelete) {
            await deleteProperty(propertyToDelete.id);
            setPropertyToDelete(null);
        }
    };

    const handleStatusChange = useCallback(async (id: string, newStatus: PropertyStatus) => {
        await updateStatus(id, newStatus);
    }, [updateStatus]);

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

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50/50 dark:bg-black pb-24 sm:pb-8 pt-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-5 py-4 rounded-3xl shadow-sm border border-white/20 dark:border-white/5 transition-all">
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
                                <div className="relative flex-1 overflow-hidden">
                                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar relative z-10">
                                        <FilterChip label="الكل" count={properties.length} active={!filter} onClick={() => setFilter(null)} />
                                        <FilterChip label="متاح" count={availableCount} active={filter === 'available'} onClick={() => setFilter('available')} />
                                        <FilterChip label="مؤجر" count={rentedCount} active={filter === 'rented'} onClick={() => setFilter('rented')} />
                                        {uniqueCategories.map((cat) => (
                                            <FilterChip key={cat} label={CATEGORY_AR[cat]} active={filter === cat} onClick={() => setFilter(cat)} />
                                        ))}
                                    </div>
                                    <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-gray-50/90 dark:from-black/90 to-transparent pointer-events-none z-20 sm:hidden"></div>
                                </div>
                                <div className="shrink-0">
                                    <PropertyFilters
                                        sortBy={sortBy}
                                        setSortBy={setSortBy}
                                        viewMode={viewMode}
                                        setViewMode={setViewMode}
                                    />
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
                                            onDelete={handleDeleteClick}
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

                {/* Centralized Delete Modal */}
                {propertyToDelete && (
                    <div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-300"
                        onClick={() => setPropertyToDelete(null)}
                    >
                        <div
                            className="bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />

                            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
                                <span className="material-symbols-outlined text-4xl text-red-500">warning</span>
                            </div>

                            <h3 className="text-center font-black text-gray-900 dark:text-white text-xl mb-2">تأكيد الحذف</h3>
                            <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-1">هل أنت متأكد من رغبتك في حذف عقار</p>
                            <p className="text-center font-bold text-gray-900 dark:text-white text-base mb-8 line-clamp-2 px-4 shadow-sm bg-gray-50 dark:bg-white/5 py-2 rounded-xl mt-3 border border-gray-100 dark:border-white/5">"{propertyToDelete.title}"؟</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPropertyToDelete(null)}
                                    className="flex-1 py-3.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold transition-colors active:scale-95"
                                >
                                    العودة للأمان
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={deletingId === propertyToDelete.id}
                                    className="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all active:scale-95 shadow-lg shadow-red-500/30 disabled:opacity-60 disabled:hover:bg-red-500 disabled:active:scale-100 flex items-center justify-center gap-2"
                                >
                                    {deletingId === propertyToDelete.id ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                                    )}
                                    {deletingId === propertyToDelete.id ? 'جاري الحذف...' : 'نعم، احذف!'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
