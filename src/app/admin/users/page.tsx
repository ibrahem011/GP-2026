'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function AdminUsersPage() {
    const searchParams = useSearchParams();
    const initialQ = searchParams.get('q') || '';

    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(initialQ);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await supabaseService.getAllProfiles();
        setUsers(data || []);
        setLoading(false);
    };

    const handleToggleAdmin = async (id: string, currentStatus: boolean) => {
        if (!confirm(currentStatus ? 'هل أنت متأكد من إزالة صلاحيات الإدارة؟' : 'هل أنت متأكد من منح صلاحيات الإدارة؟')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const result = await import('../actions').then(m => m.updateAdminUserState(session.access_token, id, { is_admin: !currentStatus }));
            
            if (!result.success) {
                alert(result.error);
                return;
            }

            setUsers(users.map(u => u.id === id ? { ...u, is_admin: !currentStatus } : u));
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء التحديث');
        }
    };

    const handleToggleVerify = async (id: string, currentStatus: boolean) => {
        try {
            await supabaseService.updateUserProfile(id, { is_verified: !currentStatus });
            setUsers(users.map(u => u.id === id ? { ...u, is_verified: !currentStatus } : u));
        } catch (error) {
            alert('حدث خطأ أثناء التحديث');
        }
    };

    const handleToggleBlock = async (id: string, currentStatus: boolean) => {
        if (!confirm(currentStatus ? 'فك الحظر عن المستخدم؟' : 'حظر هذا المستخدم؟ لا يمكنه الدخول مجدداً.')) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const result = await import('../actions').then(m => m.updateAdminUserState(session.access_token, id, { is_blocked: !currentStatus }));
            
            if (!result.success) {
                alert(result.error);
                return;
            }
            setUsers(users.map(u => u.id === id ? { ...u, is_blocked: !currentStatus } : u));
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء حظر/فك حظر المستخدم');
        }
    };

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const q = searchQuery.toLowerCase();
        return users.filter(user =>
            user.full_name?.toLowerCase().includes(q) ||
            user.phone?.includes(q) ||
            user.id.toLowerCase().includes(q)
        );
    }, [users, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-surface-darkDim p-2 rounded-2xl shadow-soft border border-slate-100 dark:border-white/5">
                <div className="relative w-full sm:w-1/2 min-w-[250px] admin-search-input">
                    <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بالاسم الصريح، رقم الهاتف أو ID..."
                        className="w-full bg-slate-50 dark:bg-slate-800 text-sm border-none rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-200"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-surface-darkDim rounded-[24px] shadow-soft border border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto text-sm">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">المستخدم</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">الدور والهاتف</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5">الحالة</th>
                                <th className="p-4 border-b border-slate-100 dark:border-white/5 whitespace-nowrap">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <tr><td colSpan={4} className="p-10 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-500">
                                            <span className="material-symbols-rounded text-5xl mb-3 opacity-30">person_off</span>
                                            <p className="font-medium">لا يوجد مستخدمين مطابقين</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group ${Object.hasOwn(user, 'is_blocked') && (user as unknown as any).is_blocked ? 'opacity-60' : ''}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-[14px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-500 overflow-hidden relative">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.full_name?.[0] || '?'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white leading-none">{user.full_name || 'بدون اسم'}</p>
                                                    <p className="text-xs text-slate-400 mt-1 uppercase">ID: {user.id.split('-')[0]}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold 
                                                    ${user.role === 'landlord' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10'}`}>
                                                    {user.role}
                                                </span>
                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400" dir="ltr">{user.phone || '-'}</span>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {user.is_admin && <span className="flex items-center gap-1 bg-red-50 text-red-600 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-[10px] px-2 py-0.5 rounded-md font-bold"><span className="material-symbols-rounded text-[12px]">security</span>Admin</span>}
                                                {user.is_verified && <span className="flex items-center gap-1 bg-green-50 text-green-600 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-[10px] px-2 py-0.5 rounded-md font-bold"><span className="material-symbols-rounded text-[12px]">verified</span>موثق</span>}
                                                {(user as any).is_blocked && <span className="flex items-center gap-1 bg-slate-100 text-slate-600 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] px-2 py-0.5 rounded-md font-bold"><span className="material-symbols-rounded text-[12px]">block</span>محظور</span>}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleVerify(user.id, user.is_verified || false)}
                                                    className={`hover:shadow-glow text-xs px-3 py-1.5 rounded-lg font-bold border transition-all 
                                                        ${user.is_verified
                                                            ? 'border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500/30'
                                                            : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-500/30 dark:bg-green-500/10'
                                                        }`}
                                                >
                                                    {user.is_verified ? 'إلغاء التوثيق' : 'توثيق الحساب'}
                                                </button>

                                                <button
                                                    onClick={() => handleToggleAdmin(user.id, user.is_admin || false)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors
                                                        ${user.is_admin
                                                            ? 'border-slate-300 text-slate-500 hover:bg-slate-100'
                                                            : 'border-amber-200 text-amber-500 hover:bg-amber-50 dark:border-amber-500/30'
                                                        }`}
                                                    title={user.is_admin ? "إزالة صلاحيات المدير" : "ترقية لمدير"}
                                                >
                                                    <span className="material-symbols-rounded text-[18px]">
                                                        {user.is_admin ? 'shield_minus' : 'shield_person'}
                                                    </span>
                                                </button>
                                                
                                                {/* Block Toggle (using type cast as it's added via server actions presumably) */}
                                                <button 
                                                    onClick={() => handleToggleBlock(user.id, (user as any).is_blocked || false)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors
                                                        ${(user as any).is_blocked
                                                            ? 'border-green-300 text-green-600 hover:bg-green-50'
                                                            : 'border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:border-white/10 dark:hover:border-red-500/30'
                                                        }`}
                                                    title={(user as any).is_blocked ? "إلغاء الحظر" : "حظر المستخدم"}
                                                >
                                                    <span className="material-symbols-rounded text-[18px]">
                                                        {(user as any).is_blocked ? 'how_to_reg' : 'block'}
                                                    </span>
                                                </button>
                                            </div>
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
