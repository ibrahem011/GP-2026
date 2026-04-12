'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseService } from '@/services/supabaseService';
import { GlassCard } from '@/components/ui/glass';

interface PaymentRequest {
    id: string;
    user_id: string;
    property_id: string;
    amount: number;
    payment_method: 'vodafone_cash' | 'instapay' | 'fawry';
    receipt_image: string | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    created_at: string;
    property_title?: string;
    user_name?: string;
}

export default function AdminPaymentsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const initialStatus = (searchParams.get('status') as any) || 'pending';
    const initialQ = searchParams.get('q') || '';

    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>(initialStatus);
    const [searchQuery, setSearchQuery] = useState(initialQ);

    useEffect(() => {
        loadPayments();
    }, [filter]);

    const handleFilterChange = (newFilter: typeof filter) => {
        setFilter(newFilter);
        const params = new URLSearchParams(searchParams.toString());
        params.set('status', newFilter);
        router.push(`?${params.toString()}`);
    };

    const loadPayments = async () => {
        setLoading(true);
        try {
            const data = await supabaseService.getPaymentRequests(
                filter === 'all' ? undefined : { status: filter }
            );

            setPayments(data as PaymentRequest[]);
        } catch (error) {
            console.error('Error loading payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (payment: PaymentRequest, newStatus: 'approved' | 'rejected') => {
        setActionLoading(payment.id);
        try {
            if (newStatus === 'approved') {
                try {
                    await supabaseService.approvePaymentAndUnlock(
                        payment.id,
                        payment.user_id,
                        payment.property_id
                    );
                    await supabaseService.createNotification({
                        userId: payment.user_id,
                        title: 'تم قبول طلب الدفع!',
                        message: 'يمكنك الآن رؤية بيانات التواصل مع المالك.',
                        type: 'success',
                        link: `/property/${payment.property_id}`,
                    });
                } catch (unlockError) {
                    console.error('Failed to unlock property:', unlockError);
                    alert('فشل فتح العقار. يرجى المحاولة مرة أخرى.');
                    loadPayments();
                    return;
                }
            } else {
                await supabaseService.rejectPaymentRequest(payment.id);
                await supabaseService.createNotification({
                    userId: payment.user_id,
                    title: 'تم رفض طلب الدفع',
                    message: 'يرجى التحقق من بيانات التحويل والمحاولة مرة أخرى.',
                    type: 'error',
                });
            }

            loadPayments();
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('فشل تحديث حالة الدفع. يرجى المحاولة مرة أخرى.');
        } finally {
            setActionLoading(null);
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        switch (method) {
            case 'vodafone_cash': return 'فودافون كاش';
            case 'instapay': return 'انستاباي';
            case 'fawry': return 'فوري';
            default: return method;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 border-green-200 dark:border-green-500/20';
            case 'pending': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-500/20';
            case 'rejected': return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-200 dark:border-red-500/20';
            default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }
    };

    const filteredPayments = useMemo(() => {
        if (!searchQuery) return payments;
        const q = searchQuery.toLowerCase();
        return payments.filter(p => 
            (p.property_title?.toLowerCase() || '').includes(q) ||
            (p.user_name?.toLowerCase() || '').includes(q) ||
            p.id.toLowerCase().includes(q)
        );
    }, [payments, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-surface-darkDim p-2 rounded-2xl shadow-soft border border-slate-100 dark:border-white/5">
                <div className="relative w-full sm:w-1/3 min-w-[250px] admin-search-input">
                    <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بواسطة العقار أو المستخدم..."
                        className="w-full bg-slate-50 dark:bg-slate-800 text-sm border-none rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-200"
                    />
                </div>

                <div className="w-full sm:w-auto overflow-x-auto flex items-center gap-1.5 sm:mr-auto pb-1 sm:pb-0 scrollbar-hide">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map(f => {
                        const count = f === 'all' ? payments.length : payments.filter(p => p.status === f).length;
                        return (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(f)}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === f
                                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-md'
                                        : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {f === 'pending' ? 'معلقة' : f === 'approved' ? 'مقبولة' : f === 'rejected' ? 'مرفوضة' : 'الكل'}
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

            <div className="bg-white dark:bg-surface-darkDim rounded-[24px] shadow-soft border border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto text-sm">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">المستند</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">التفاصيل</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">المبلغ وطريقة التحويل</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">الحالة</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5 whitespace-nowrap">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="p-10 text-center text-slate-500"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                                <span className="material-symbols-rounded text-[32px] text-slate-300 dark:text-slate-600">receipt_long</span>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">لا توجد طلبات دفع حالياً.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                                                {payment.receipt_image ? (
                                                    <a href={payment.receipt_image} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                        <img src={payment.receipt_image} alt="إيصال" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                                                    </a>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="material-symbols-rounded text-slate-300 dark:text-slate-600">image_not_supported</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white line-clamp-1">{payment.property_title || 'عقار'}</div>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <span className="material-symbols-rounded text-[14px]">person</span>
                                                {payment.user_name || 'مستخدم'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-primary dark:text-primary-light">
                                                {payment.amount} ج.م
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 inline-flex bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                {getPaymentMethodLabel(payment.payment_method)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusStyle(payment.status)}`}>
                                                {payment.status === 'pending' ? 'معلق' : payment.status === 'approved' ? 'مقبول' : 'مرفوض'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {payment.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleAction(payment, 'approved')} 
                                                        disabled={actionLoading === payment.id}
                                                        className="h-8 px-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center text-xs font-bold disabled:opacity-50 gap-1"
                                                    >
                                                        {actionLoading === payment.id ? (
                                                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                                        ) : <span className="material-symbols-rounded text-[16px]">lock_open</span>}
                                                        فتح العقار
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(payment, 'rejected')} 
                                                        disabled={actionLoading === payment.id}
                                                        className="w-8 h-8 rounded-lg bg-white dark:bg-transparent border border-red-200 dark:border-red-500/30 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        <span className="material-symbols-rounded text-[16px]">close</span>
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
