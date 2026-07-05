'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { PropertyContextCard } from '@/components/chat/PropertyContextCard';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ImageMessage } from '@/components/chat/ImageMessage';
import { VoiceNoteBubble } from '@/components/chat/VoiceNoteBubble';
import { SystemMessage } from '@/components/chat/SystemMessage';
import { DateSeparator } from '@/components/chat/DateSeparator';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { OnlineIndicator } from '@/components/chat/OnlineIndicator';
import { isSameDay } from 'date-fns';

interface ChatPageProps {
    params: Promise<{ id: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversationDetails, setConversationDetails] = useState<any>(null);
    const [hasMediaPermission, setHasMediaPermission] = useState(false);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        params.then(unwrappedParams => {
            setConversationId(unwrappedParams.id);
        });
    }, [params]);

    useEffect(() => {
        if (conversationId && user) {
            fetchConversationData();
            loadMessages();

            // Mark as read on enter
            supabaseService.markMessagesAsRead(conversationId, user.id);

            // Subscribe to new messages
            const chatChannel = supabase
                .channel(`chat-${conversationId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${conversationId}`
                    },
                    (payload) => {
                        // Optimistically append if not already there (though usually we trust fetch)
                        // But for instant update, we append
                        setMessages((prev) => [...prev, payload.new]);

                        if (payload.new.sender_id !== user.id) {
                            supabaseService.markMessagesAsRead(conversationId, user.id);
                        }
                        scrollToBottom();
                    }
                )
                .subscribe();

            // Subscribe to typing indicator
            const unsubscribeTyping = supabaseService.subscribeToTypingIndicator(conversationId, (typing) => {
                setIsTyping(typing);
            });

            return () => {
                supabase.removeChannel(chatChannel);
                unsubscribeTyping();
            };
        }
    }, [conversationId, user]);

    const fetchConversationData = async () => {
        if (!conversationId) return;
        const details = await supabaseService.getConversationDetails(conversationId);
        if (details) {
            setConversationDetails(details);
            setHasMediaPermission(details.media_permission_status === 'granted');
            const partner = details.owner_id === user?.id ? details.buyer : details.owner;
            setOtherUser(partner);
        }
    };

    const loadMessages = async () => {
        if (!conversationId) return;
        const data = await supabaseService.getMessages(conversationId, 100); // Load last 100
        setMessages(data);
        setInitialLoad(false);
        setTimeout(scrollToBottom, 500); // Small delay to ensure rendering
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (text: string) => {
        if (!user || !conversationId) return;

        // Optimistic UI update could go here, but for now we rely on the realtime subscription to append
        try {
            await supabaseService.sendMessage({
                conversationId,
                senderId: user.id,
                text,
                messageType: 'text'
            });
        } catch (error) {
            console.error('Failed to send:', error);
            alert('فشل إرسال الرسالة');
        }
    };

    const handleSystemAction = async (action: string) => {
        if (action === 'grant' && conversationId) {
            await supabaseService.grantMediaPermission(conversationId);
            setHasMediaPermission(true);
            // Refresh details
            fetchConversationData();
        } else if (action === 'deny' && conversationId) {
            await supabaseService.denyMediaPermission(conversationId);
        }
    };

    // Group messages by date
    const renderMessages = () => {
        const groups: React.ReactNode[] = [];
        let lastDate: Date | null = null;

        messages.forEach((msg, index) => {
            const msgDate = new Date(msg.created_at);
            const isMe = msg.sender_id === user?.id;

            // Add date separator if new day
            if (!lastDate || !isSameDay(lastDate, msgDate)) {
                groups.push(<DateSeparator key={`date-${msg.id}`} date={msgDate} />);
                lastDate = msgDate;
            }

            if (msg.message_type === 'text') {
                groups.push(
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMe={isMe}
                        showAvatar={!isMe}
                    />
                );
            } else if (msg.message_type === 'image') {
                groups.push(
                    <ImageMessage
                        key={msg.id}
                        message={msg}
                        isMe={isMe}
                    />
                );
            } else if (msg.message_type === 'voice') {
                groups.push(
                    <VoiceNoteBubble
                        key={msg.id}
                        message={msg}
                        isMe={isMe}
                    />
                );
            } else if (msg.message_type === 'system') {
                groups.push(
                    <SystemMessage
                        key={msg.id}
                        type={msg.metadata?.type}
                        data={msg.metadata}
                        onAction={handleSystemAction}
                    />
                );
            }
        });

        return groups;
    };

    if (!conversationId || initialLoad) {
        return (
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-black items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="flex flex-col h-screen bg-gray-50 dark:bg-black overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700 p-3 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        aria-label="الرجوع"
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary"
                    >
                        <span className="material-symbols-outlined text-gray-500" aria-hidden="true">arrow_forward</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={otherUser?.avatar_url || '/placeholder-user.png'}
                                className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-zinc-600"
                                alt=""
                            />
                            <OnlineIndicator isOnline={otherUser?.online_status || false} className="right-0 bottom-0 w-3 h-3 border-2" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                {otherUser?.full_name || 'مستخدم'}
                                {otherUser?.is_verified && <span className="material-symbols-outlined text-blue-500 text-[16px]">verified</span>}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {otherUser?.online_status ? 'متصل الآن' : 'غير متصل'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        aria-label="اتصال"
                        className="w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-700 flex items-center justify-center text-gray-500 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary"
                    >
                        <span className="material-symbols-outlined" aria-hidden="true">call</span>
                    </button>
                    <button
                        aria-label="المزيد من الخيارات"
                        className="w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-700 flex items-center justify-center text-gray-500 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary"
                    >
                        <span className="material-symbols-outlined" aria-hidden="true">more_vert</span>
                    </button>
                </div>
            </div>

            {/* Property Context */}
            {conversationDetails?.property && (
                <PropertyContextCard property={conversationDetails.property} />
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f0f2f5] dark:bg-black/50" style={{ backgroundImage: "url('/cubes.png')", backgroundBlendMode: 'overlay' }}>
                <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full pb-4">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 mt-20">
                            <span className="material-symbols-outlined text-6xl mb-4">chat_bubble</span>
                            <p>لا توجد رسائل بعد.. ابدأ بالترحيب!</p>
                        </div>
                    ) : (
                        renderMessages()
                    )}

                    {isTyping && <TypingIndicator />}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Chat Input */}
            <div className="z-20">
                <ChatInput
                    conversationId={conversationId}
                    currentUserId={user?.id || ''}
                    hasMediaPermission={hasMediaPermission}
                    onSendMessage={handleSendMessage}
                    onRequestPermission={async () => {
                        await supabaseService.requestMediaPermission(conversationId, user!.id);
                    }}
                />
            </div>
        </main>
    );
}
