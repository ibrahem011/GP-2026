'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/glass';

export default function AdminBookingsClient({ initialQ = '' }: { initialQ?: string }) {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(initialQ);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await supabase
                .from('tenant_property')
                .select(`
                    id, start_date, end_date, total_amount, status, created_at,
                    properties ( id, title, owner_id ),
                    profiles!tenant_property_user_id_fkey ( id, full_name, phone )
                `)
                .order('created_at', { ascending: false });

            setBookings(data.data || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        if (!confirm('تأكيد تغيير حالة الحجز؟')) return;
        try {
            await supabase
                .from('tenant_property')
                .update({ status: newStatus })
                .eq('id', id);

            setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
        } catch (error) {
            alert('حدث خطأ');
        }
    };

    const filteredBookings = useMemo(() => {
        if (!searchQuery) return bookings;
        const q = searchQuery.toLowerCase();
        return bookings.filter(b => 
            (b.profiles?.full_name?.toLowerCase() || '').includes(q) ||
            (b.properties?.title?.toLowerCase() || '').includes(q) ||
            b.id.toLowerCase().includes(q)
        );
    }, [bookings, searchQuery]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 border-green-200 dark:border-green-500/20';
            case 'pending': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-500/20';
            case 'rejected': return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-200 dark:border-red-500/20';
            default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed': return 'مؤكد';
            case 'pending': return 'معلق';
            case 'rejected': return 'مرفوض';
            case 'completed': return 'مكتمل';
            case 'cancelled': return 'ملغى';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-surface-darkDim p-2 rounded-2xl shadow-soft border border-slate-100 dark:border-white/5">
                <div className="relative w-full sm:w-1/2 min-w-[250px] admin-search-input">
                    <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بواسطة المستأجر، العقار أو رقم الحجز..."
                        className="w-full bg-slate-50 dark:bg-slate-800 text-sm border-none rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-200"
                    />
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-surface-darkDim rounded-[24px] shadow-soft border border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto text-sm">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">العقار</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">المستأجر</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">الفترة</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">الإجمالي</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">الحالة</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5 whitespace-nowrap">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="p-10 text-center text-slate-500"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                                <span className="material-symbols-rounded text-[32px] text-slate-300 dark:text-slate-600">book_online</span>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">لا توجد حجوزات مطابقة.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white line-clamp-1">{booking.properties?.title || 'عقار محذوف'}</div>
                                            <div className="text-xs text-slate-400 mt-1 uppercase">ID: {booking.id.split('-')[0]}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-700 dark:text-slate-200">{booking.profiles?.full_name || 'غير معروف'}</div>
                                            <div className="text-xs text-slate-500 mt-0.5" dir="ltr">{booking.profiles?.phone || 'بدون هاتف'}</div>
                                        </td>
                                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(booking.start_date).toLocaleDateString()} 
                                            <span className="material-symbols-rounded text-[14px] align-middle mx-1 text-slate-300">arrow_forward</span> 
                                            {new Date(booking.end_date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-primary dark:text-primary-light whitespace-nowrap">
                                                {booking.total_amount} ج.م
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusStyle(booking.status)}`}>
                                                {getStatusLabel(booking.status)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {booking.status === 'pending' ? (
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleUpdateStatus(booking.id, 'confirmed')} className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-colors flex items-center justify-center">
                                                        <span className="material-symbols-rounded text-[18px]">check</span>
                                                    </button>
                                                    <button onClick={() => handleUpdateStatus(booking.id, 'rejected')} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center">
                                                        <span className="material-symbols-rounded text-[18px]">close</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
