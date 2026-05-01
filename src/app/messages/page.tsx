'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { SecurityAlert } from '@/components/chat/SecurityAlert';
import { UnreadBadge } from '@/components/chat/UnreadBadge';
import { OnlineIndicator } from '@/components/chat/OnlineIndicator';

export default function MessagesPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredConversations = conversations.filter(conv => {
        const otherUser = user?.id === conv.buyer_id ? conv.owner : conv.buyer;
        const searchLower = searchQuery.toLowerCase();

        return (
            (conv.property?.title || '').toLowerCase().includes(searchLower) ||
            (otherUser?.full_name || '').toLowerCase().includes(searchLower)
        );
    });

    useEffect(() => {
        if (user) {
            loadConversations();

            // الاشتراك في التحديثات اللحظية للرسائل لتحديث القائمة
            const channel = supabase
                .channel('schema-db-changes')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages' },
                    () => {
                        loadConversations(); // إعادة التحميل عند وصول رسالة جديدة
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const loadConversations = async () => {
        if (!user) return;
        const data = await supabaseService.getUserConversations(user.id);
        setConversations(data);
        setLoading(false);
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-black" dir="rtl">
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">lock</span>
                    <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">يرجى تسجيل الدخول</h2>
                    <p className="text-gray-500 mb-6">يجب عليك تسجيل الدخول لرؤية رسائلك</p>
                    <Link href="/auth" className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30">
                        تسجيل الدخول
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black pb-24" dir="rtl">

            {/* Security Alert */}
            <SecurityAlert />

            <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <button
                            aria-label="الرجوع"
                            onClick={() => router.back()}
                            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary"
                        >
                            <span aria-hidden="true" className="material-symbols-outlined text-gray-500">arrow_forward</span>
                        </button>
                        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                            رسائلي
                        </h1>
                    </div>
                    <button aria-label="الدعم الفني" className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-gray-500 shadow-sm border border-gray-100 dark:border-zinc-700 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary">
                        <span aria-hidden="true" className="material-symbols-outlined">support_agent</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6 group">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="ابحث عن محادثة أو عقار..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl py-3.5 pr-12 pl-4 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                    />
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-3xl shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-4xl text-gray-300">chat_bubble_outline</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد محادثات</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'ابدأ محادثة مع المؤجرين للاستفسار عن العقارات'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredConversations.map((conv) => {
                            const otherUser = user?.id === conv.buyer_id ? conv.owner : conv.buyer;
                            const isUnread = conv.last_message && !conv.last_message.is_read && conv.last_message.sender_id !== user?.id;

                            // Mock unread count for now, ideally comes from DB
                            const unreadCount = isUnread ? 1 : 0;

                            return (
                                <Link
                                    key={conv.id}
                                    href={`/messages/${conv.id}`}
                                    className={`relative flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-white dark:hover:bg-zinc-800 border-2 group
                                    ${isUnread
                                            ? 'bg-white dark:bg-zinc-800 border-primary/10 shadow-sm'
                                            : 'bg-transparent border-transparent hover:border-gray-100 dark:hover:border-zinc-700'
                                        }`}
                                >
                                    {/* Image Container */}
                                    <div className="relative shrink-0">
                                        <img
                                            src={otherUser?.avatar_url || '/placeholder-user.png'} // Prioritize User Avatar for Chat List
                                            className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-sm"
                                            alt=""
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-user.png';
                                            }}
                                        />
                                        <OnlineIndicator isOnline={otherUser?.online_status || false} className="right-1 bottom-1 w-3.5 h-3.5 border-[3px]" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-bold truncate text-lg ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {otherUser?.full_name || 'مستخدم'}
                                            </h3>
                                            {conv.last_message && (
                                                <span className={`text-xs whitespace-nowrap px-2 py-0.5 rounded-full ${isUnread ? 'text-primary bg-primary/10 font-bold' : 'text-gray-400'}`}>
                                                    {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true, locale: ar })}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                            <span className="material-symbols-outlined text-[16px] text-gray-400">home_work</span>
                                            <span className="truncate max-w-[200px]">{conv.property?.title || 'عقار'}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <p className={`truncate max-w-[85%] text-sm ${isUnread ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'}`}>
                                                {conv.last_message?.text || (conv.last_message?.media_url ? '📷 صورة' : 'ابدأ المحادثة...')}
                                            </p>
                                            <UnreadBadge count={unreadCount} />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
