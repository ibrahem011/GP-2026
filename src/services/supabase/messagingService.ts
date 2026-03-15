import { isMockModeEnabled, supabase } from './client';
import { MOCK_PROPERTIES } from './mockData';

type SendMessageParams = {
    conversationId: string;
    senderId: string;
    text?: string;
    messageType?: 'text' | 'voice' | 'image' | 'system';
    mediaUrl?: string;
    duration?: number;
    metadata?: any;
};

export function createMessagingService() {
    async function createConversation(params: {
        propertyId: string;
        buyerId: string;
        ownerId: string;
    }): Promise<string> {
        if (isMockModeEnabled()) return 'mock-conv-1';

        const { data: existing, error: fetchError } = await supabase
            .from('conversations')
            .select('id')
            .eq('property_id', params.propertyId)
            .eq('buyer_id', params.buyerId)
            .eq('owner_id', params.ownerId)
            .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw new Error(`فشل جلب المحادثة: ${fetchError.message}`);
        }

        if (existing) return existing.id;

        const { data, error } = await supabase
            .from('conversations')
            .insert({
                property_id: params.propertyId,
                buyer_id: params.buyerId,
                owner_id: params.ownerId,
            })
            .select('id')
            .single();

        if (error) {
            if (error.code === '23505') {
                const { data: dup } = await supabase
                    .from('conversations')
                    .select('id')
                    .eq('property_id', params.propertyId)
                    .eq('buyer_id', params.buyerId)
                    .eq('owner_id', params.ownerId)
                    .maybeSingle();

                if (dup?.id) return dup.id;
            }

            throw new Error(`فشل بدء المحادثة: ${error.message}`);
        }

        return data.id;
    }

    async function getUserConversations(userId: string) {
        if (isMockModeEnabled()) {
            return [
                {
                    id: 'mock-conv-1',
                    property_id: '1',
                    buyer_id: userId,
                    owner_id: 'owner-1',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    property: MOCK_PROPERTIES[0],
                    buyer: { full_name: 'ظ…ط³طھط®ط¯ظ… طھط¬ط±ظٹط¨ظٹ', avatar_url: null },
                    owner: { full_name: 'ط§ظ„ط­ط§ط¬ ظ…ط­ظ…ط¯', avatar_url: null },
                    last_message: { text: 'ظ‡ظ„ ط§ظ„ط¹ظ‚ط§ط± ظ„ط§ ظٹط²ط§ظ„ ظ…طھط§ط­ط§ظ‹طں', created_at: new Date().toISOString(), is_read: false, sender_id: userId }
                }
            ];
        }

        const { data: asBuyer, error: errBuyer } = await supabase
            .from('conversations')
            .select(`
                *,
                property:properties(title, images),
                buyer:profiles!buyer_id(full_name, avatar_url),
                owner:profiles!owner_id(full_name, avatar_url),
                last_message:messages(text, created_at, is_read, sender_id)
            `)
            .eq('buyer_id', userId)
            .order('updated_at', { ascending: false });

        const { data: asOwner, error: errOwner } = await supabase
            .from('conversations')
            .select(`
                *,
                property:properties(title, images),
                buyer:profiles!buyer_id(full_name, avatar_url),
                owner:profiles!owner_id(full_name, avatar_url),
                last_message:messages(text, created_at, is_read, sender_id)
            `)
            .eq('owner_id', userId)
            .order('updated_at', { ascending: false });

        const error = errBuyer || errOwner;
        const data = [...(asBuyer || []), ...(asOwner || [])]
            .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        if (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }

        return data.map((conv: any) => ({
            ...conv,
            last_message: conv.last_message?.[0] || null
        }));
    }

    async function getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
        if (isMockModeEnabled()) {
            return [
                {
                    id: 'msg-1',
                    conversation_id: conversationId,
                    sender_id: 'mock-user-123',
                    text: 'ط§ظ„ط³ظ„ط§ظ… ط¹ظ„ظٹظƒظ…طŒ ظ‡ظ„ ط§ظ„ط´ظ‚ط© ظ…طھط§ط­ط©طں',
                    created_at: new Date(Date.now() - 100000).toISOString(),
                    is_read: true,
                    message_type: 'text'
                },
                {
                    id: 'msg-2',
                    conversation_id: conversationId,
                    sender_id: 'owner-1',
                    text: 'ظˆط¹ظ„ظٹظƒظ… ط§ظ„ط³ظ„ط§ظ…طŒ ظ†ط¹ظ… ظ…طھط§ط­ط© ظٹط§ ظپظ†ط¯ظ….',
                    created_at: new Date(Date.now() - 50000).toISOString(),
                    is_read: false,
                    message_type: 'text'
                }
            ];
        }

        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:profiles(full_name, avatar_url)')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        return (data || []).reverse();
    }

    async function sendMessage(params: SendMessageParams) {
        if (isMockModeEnabled()) {
            return;
        }

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: params.conversationId,
                sender_id: params.senderId,
                text: params.text,
                message_type: params.messageType || 'text',
                media_url: params.mediaUrl,
                duration: params.duration,
                metadata: params.metadata
            });

        if (error) throw new Error(`ظپط´ظ„ ط¥ط±ط³ط§ظ„ ط§ظ„ط±ط³ط§ظ„ط©: ${error.message}`);

        await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', params.conversationId);
    }

    async function markMessagesAsRead(conversationId: string, userId: string) {
        if (isMockModeEnabled()) return;

        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .eq('is_read', false);
    }

    async function requestMediaPermission(conversationId: string, userId: string): Promise<void> {
        if (isMockModeEnabled()) {
            return;
        }

        await supabase
            .from('conversations')
            .update({ media_permission_status: 'requested' })
            .eq('id', conversationId);

        await sendMessage({
            conversationId,
            senderId: userId,
            text: '',
            messageType: 'system',
            metadata: { type: 'media_permission_request' }
        });
    }

    async function grantMediaPermission(conversationId: string): Promise<void> {
        if (isMockModeEnabled()) return;

        await supabase
            .from('conversations')
            .update({ media_permission_status: 'granted' })
            .eq('id', conversationId);
    }

    async function denyMediaPermission(conversationId: string): Promise<void> {
        if (isMockModeEnabled()) return;

        await supabase
            .from('conversations')
            .update({ media_permission_status: 'denied' })
            .eq('id', conversationId);
    }

    async function getConversationDetails(conversationId: string): Promise<any> {
        if (isMockModeEnabled()) {
            return {
                id: conversationId,
                property_id: '1',
                tenant_id: 'mock-user-123',
                owner_id: 'owner-1',
                media_permission_status: 'none',
                property: MOCK_PROPERTIES[0]
            };
        }

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                property:properties(*),
                buyer:profiles!buyer_id(full_name, avatar_url, online_status, is_verified),
                owner:profiles!owner_id(full_name, avatar_url, online_status, is_verified)
            `)
            .eq('id', conversationId)
            .single();

        if (error) {
            console.error('Error fetching conversation details:', error);
            return null;
        }

        return data;
    }

    async function updateOnlineStatus(userId: string, status: boolean) {
        if (isMockModeEnabled()) return;

        const { error } = await supabase
            .from('profiles')
            .update({
                online_status: status,
                last_seen: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) console.error('Error updating online status:', error);
    }

    async function sendTypingIndicator(conversationId: string, isTyping: boolean) {
        const channel = supabase.channel(`typing-${conversationId}`);
        await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { isTyping }
        });
    }

    function subscribeToTypingIndicator(conversationId: string, callback: (isTyping: boolean) => void) {
        const channel = supabase.channel(`typing-${conversationId}`)
            .on(
                'broadcast',
                { event: 'typing' },
                (payload) => callback(payload.payload.isTyping)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    return {
        createConversation,
        getUserConversations,
        getMessages,
        sendMessage,
        markMessagesAsRead,
        requestMediaPermission,
        grantMediaPermission,
        denyMediaPermission,
        getConversationDetails,
        updateOnlineStatus,
        sendTypingIndicator,
        subscribeToTypingIndicator,
    };
}
