'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseService, PropertyRow } from '@/services/supabaseService';
import { CATEGORY_AR, PRICE_UNIT_AR, STATUS_AR } from '@/types';
import Link from 'next/link';

export default function AdminPropertiesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // Read ?status= and ?q= from URL
    const initialStatus = (searchParams.get('status') as any) || 'pending';
    const initialQ = searchParams.get('q') || '';

    const [properties, setProperties] = useState<PropertyRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'pending' | 'available' | 'rejected' | 'all'>(initialStatus);
    const [searchQuery, setSearchQuery] = useState(initialQ);

    useEffect(() => {
        loadProperties();
    }, [filter]);

    // Update query params when filter changes 
    const handleFilterChange = (newFilter: typeof filter) => {
        setFilter(newFilter);
        const params = new URLSearchParams(searchParams.toString());
        params.set('status', newFilter);
        router.push(`?${params.toString()}`);
    };

    const loadProperties = async () => {
        setLoading(true);
        try {
            const data = await supabaseService.getProperties(
                filter === 'all' ? undefined : { status: filter }
            );
            setProperties(data);
        } catch (error) {
            console.error('Error loading properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, newStatus: 'available' | 'rejected') => {
        setActionLoading(id);
        try {
            await supabaseService.moderatePropertyListing(id, newStatus);
            // Notifications...
            const property = properties.find(p => p.id === id);
            if (property) {
                await supabaseService.createNotification({
                    userId: property.owner_id,
                    title: newStatus === 'available' ? 'تمت الموافقة على عقارك!' : 'تم رفض عقارك',
                    message: newStatus === 'available'
                        ? `عقارك "${property.title}" أصبح متاحاً للعرض الآن.`
                        : `عقارك "${property.title}" لم يستوفِ معايير النشر.`,
                    type: newStatus === 'available' ? 'success' : 'error',
                    link: `/property/${property.id}`,
                });
            }
            loadProperties();
        } catch (error) {
            console.error('Error updating property:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const label = STATUS_AR[status as keyof typeof STATUS_AR] ?? status;
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-xs font-bold leading-none border border-amber-200 dark:border-amber-500/20 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>{label}</span>;
            case 'available':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 text-xs font-bold leading-none border border-green-200 dark:border-green-500/20 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{label}</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 text-xs font-bold leading-none border border-red-200 dark:border-red-500/20 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{label}</span>;
            case 'rented':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 text-xs font-bold leading-none border border-blue-200 dark:border-blue-500/20 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>{label}</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold leading-none border border-slate-200 dark:border-slate-700 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>{label}</span>;
        }
    };

    // Filter properties based on local search input
    const filteredProperties = useMemo(() => {
        if (!searchQuery) return properties;
        const q = searchQuery.toLowerCase();
        return properties.filter(p => 
            p.title.toLowerCase().includes(q) || 
            (p.owner_name && p.owner_name.toLowerCase().includes(q)) ||
            p.id.toLowerCase().includes(q) // in case ID is passed in q
        );
    }, [properties, searchQuery]);

    return (
        <div className="space-y-6">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-surface-darkDim p-2 rounded-2xl shadow-soft border border-slate-100 dark:border-white/5">
                
                {/* Search Input */}
                <div className="relative w-full sm:w-1/3 min-w-[250px]">
                    <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بواسطة العنوان, المالك أو الـ ID..."
                        className="w-full bg-slate-50 dark:bg-slate-800 text-sm border-none rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-200"
                    />
                </div>

                {/* Filter Pills */}
                <div className="w-full sm:w-auto overflow-x-auto flex items-center gap-1.5 sm:mr-auto pb-1 sm:pb-0 scrollbar-hide">
                    {(['pending', 'available', 'rejected', 'all'] as const).map(f => {
                        const count = f === 'all' 
                            ? properties.length 
                            : properties.filter(p => p.status === f).length;
                            
                        return (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(f)}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === f
                                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-md'
                                        : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {f === 'pending' ? 'معلقة' : f === 'available' ? 'منشورة' : f === 'rejected' ? 'مرفوضة' : 'الكل'}
                                {filter === f && (
                                    <span className={`px-1.5 py-0.5 rounded-lg text-[10px] ${filter === f ? 'bg-white/20 dark:bg-black/20 text-current' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Properties Grid */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredProperties.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredProperties.map(prop => (
                        <div key={prop.id} className="group flex flex-col sm:flex-row bg-white dark:bg-surface-darkDim rounded-[20px] shadow-sm hover:shadow-soft border border-slate-100 dark:border-white/5 overflow-hidden transition-all duration-300">
                            
                            {/* Image side */}
                            <div className="sm:w-48 h-48 sm:h-auto bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0">
                                {prop.images[0] ? (
                                    <img src={prop.images[0]} alt={`صورة ${prop.title}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-rounded text-slate-300 dark:text-slate-600 text-4xl">image</span>
                                    </div>
                                )}
                                <div className="absolute top-3 left-3">
                                    {getStatusBadge(prop.status)}
                                </div>
                            </div>

                            {/* Info side */}
                            <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                                <div>
                                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">{prop.title}</h3>
                                        <div className="bg-primary/10 text-primary dark:text-primary-light px-3 py-1 rounded-lg font-bold text-sm leading-none flex items-center gap-1 border border-primary/20">
                                            {prop.price} ج.م
                                            <span className="text-[10px] font-medium opacity-70">/ {PRICE_UNIT_AR[prop.price_unit as keyof typeof PRICE_UNIT_AR]}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                                            <span className="material-symbols-rounded text-[16px]">category</span>
                                            {CATEGORY_AR[prop.category as keyof typeof CATEGORY_AR]}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                                            <span className="material-symbols-rounded text-[16px]">location_on</span>
                                            {prop.area || 'جمصة'}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                                            <span className="material-symbols-rounded text-[16px]">person</span>
                                            {prop.owner_name || 'غير معروف'}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/5 mt-auto">
                                    {prop.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(prop.id, 'available')}
                                                disabled={actionLoading === prop.id}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                                            >
                                                <span className="material-symbols-rounded text-[18px]">check_circle</span>
                                                قبول النشر
                                            </button>
                                            <button
                                                onClick={() => handleAction(prop.id, 'rejected')}
                                                disabled={actionLoading === prop.id}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-transparent border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                                            >
                                                <span className="material-symbols-rounded text-[18px]">cancel</span>
                                                رفض
                                            </button>
                                        </>
                                    )}
                                    <Link
                                        href={`/property/${prop.id}`}
                                        target="_blank"
                                        className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <span className="material-symbols-rounded text-[18px]">visibility</span>
                                        معاينة العقار
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-surface-darkDim rounded-[24px] border border-slate-100 dark:border-white/5">
                    <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <span className="material-symbols-rounded text-[40px] text-slate-300 dark:text-slate-600">
                            {searchQuery ? 'search_off' : 'inventory_2'}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        {searchQuery ? 'لا توجد نتائج بحث' : 'لا توجد عقارات حالياً'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        {searchQuery 
                            ? 'جرب البحث بكلمات مختلفة أو امسح شريط البحث.' 
                            : filter === 'pending' ? 'لا توجد عقارات جديدة في انتظار المراجعة.' : 'القائمة فارغة في الوقت الحالي.'}
                    </p>
                </div>
            )}
        </div>
    );
}
