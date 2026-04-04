'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,


} from '@/components/ui/sheet';

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

    console.log('[DEBUG MyPropertiesPage] raw properties loaded:', properties.length);
    console.log('[DEBUG MyPropertiesPage] filteredProperties returned:', displayedProperties.length);
    if(properties.length > 0) console.log('[DEBUG MyPropertiesPage] Sample property:', properties[0]);

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
                                aria-label="الرجوع"
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

                            {/* Desktop Unified Toolbar */}
                            <div className="hidden md:flex items-center justify-between bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-2 mb-6 shadow-sm">
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                                    <div className="flex items-center gap-1 bg-white/80 dark:bg-zinc-700/50 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                                        <FilterChip label="الكل" count={properties.length} active={!filter} onClick={() => setFilter(null)} />
                                        <FilterChip label="متاح" count={availableCount} active={filter === 'available'} onClick={() => setFilter('available')} />
                                        <FilterChip label="مؤجر" count={rentedCount} active={filter === 'rented'} onClick={() => setFilter('rented')} />
                                    </div>
                                    {uniqueCategories.length > 0 && (
                                        <div className="w-px h-8 bg-gray-200 dark:bg-white/10 mx-1"></div>
                                    )}
                                    {uniqueCategories.length > 0 && (
                                        <div className="flex items-center gap-1 bg-white/80 dark:bg-zinc-700/50 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                                            {uniqueCategories.map((cat) => (
                                                <FilterChip key={cat} label={CATEGORY_AR[cat]} active={filter === cat} onClick={() => setFilter(cat)} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="shrink-0 flex items-center gap-3">
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

                {/* Mobile Floating Action Buttons */}
                <div className="fixed bottom-24 left-4 right-4 z-50 md:hidden flex items-center justify-between pointer-events-none">
                    <Link
                        href="/add-property"
                        className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 active:scale-95 transition-transform pointer-events-auto"
                    >
                        <span className="material-symbols-outlined text-[28px]">add</span>
                    </Link>

                    <Sheet>
                        <SheetTrigger asChild>
                            <button className="flex items-center gap-2 px-5 h-14 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-full shadow-xl shadow-black/10 dark:shadow-white/5 active:scale-95 transition-transform pointer-events-auto border border-gray-100 dark:border-white/10 font-bold">
                                <span className="material-symbols-outlined text-[24px]">tune</span>
                                تصفية وترتيب
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-[2rem] px-4 pb-8 pt-4">
                            <SheetHeader className="mb-6 text-center sm:text-center">
                                <div className="mx-auto w-12 h-1.5 rounded-full bg-gray-200 dark:bg-zinc-800 mb-6" />
                                <SheetTitle className="text-xl font-black">تصفية وترتيب</SheetTitle>
                            </SheetHeader>
                            
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 px-1">ترتيب حسب</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'newest', label: 'الأحدث أولاً' },
                                            { id: 'oldest', label: 'الأقدم أولاً' },
                                            { id: 'views', label: 'الأكثر مشاهدة' },
                                            { id: 'price_high', label: 'السعر: الأعلى' },
                                            { id: 'price_low', label: 'السعر: الأقل' },
                                        ].map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => setSortBy(option.id as 'newest' | 'oldest' | 'views' | 'price_high' | 'price_low')}
                                                className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                                                    sortBy === option.id 
                                                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                                    : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 px-1">حالة العقار</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setFilter(null)}
                                            className={`py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                                                !filter
                                                ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-md'
                                                : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300'
                                            }`}
                                        >
                                            الكل
                                        </button>
                                        <button
                                            onClick={() => setFilter('available')}
                                            className={`py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                                                filter === 'available'
                                                ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                                                : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300'
                                            }`}
                                        >
                                            متاح ({availableCount})
                                        </button>
                                        <button
                                            onClick={() => setFilter('rented')}
                                            className={`py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                                                filter === 'rented'
                                                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                                : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300'
                                            }`}
                                        >
                                            مؤجر ({rentedCount})
                                        </button>
                                    </div>
                                </div>

                                {uniqueCategories.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 px-1">نوع العقار</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {uniqueCategories.map((cat) => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setFilter(cat)}
                                                    className={`py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                                                        filter === cat
                                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {CATEGORY_AR[cat] || cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="pt-4 mt-6 border-t border-gray-100 dark:border-white/10">
                                    <SheetClose asChild>
                                        <button className="w-full py-3.5 rounded-xl bg-primary text-white font-bold transition-all shadow-lg shadow-primary/30 active:scale-95 flex justify-center items-center gap-2">
                                            عرض العقارات
                                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                        </button>
                                    </SheetClose>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

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
                            <p className="text-center font-bold text-gray-900 dark:text-white text-base mb-8 line-clamp-2 px-4 shadow-sm bg-gray-50 dark:bg-white/5 py-2 rounded-xl mt-3 border border-gray-100 dark:border-white/5">&quot;{propertyToDelete.title}&quot;؟</p>

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
