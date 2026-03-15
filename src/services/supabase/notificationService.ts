import { isMockModeEnabled, supabase } from './client';

export function createNotificationService() {
    async function getNotifications(userId: string): Promise<{
        id: string;
        title: string;
        message: string | null;
        type: string;
        is_read: boolean;
        link: string | null;
        created_at: string;
    }[]> {
        if (isMockModeEnabled()) {
            return [
                {
                    id: 'notif-1',
                    title: 'ظ…ط±ط­ط¨ط§ظ‹ ط¨ظƒ ظپظٹ ط¹ظ‚ط§ط±ط§طھ ط¬ظ…طµط©',
                    message: 'ظ†طھظ…ظ†ظ‰ ظ„ظƒ طھط¬ط±ط¨ط© ظ…ظ…طھط¹ط© ظپظٹ ط§ظ„ط¨ط­ط« ط¹ظ† ط¹ظ‚ط§ط±ظƒ ط§ظ„ظ…ط«ط§ظ„ظٹ.',
                    type: 'info',
                    is_read: false,
                    link: null,
                    created_at: new Date().toISOString()
                }
            ];
        }

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
        return data || [];
    }

    async function markNotificationAsRead(notificationId: string): Promise<void> {
        if (isMockModeEnabled()) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
    }

    async function markAllNotificationsAsRead(userId: string): Promise<void> {
        if (isMockModeEnabled()) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId);
    }

    async function createNotification(params: {
        userId: string;
        title: string;
        message: string;
        type: 'success' | 'info' | 'warning' | 'error';
        link?: string;
    }): Promise<void> {
        if (isMockModeEnabled()) {
            return;
        }
        await supabase
            .from('notifications')
            .insert({
                user_id: params.userId,
                title: params.title,
                message: params.message,
                type: params.type,
                link: params.link,
            });
    }

    return {
        getNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        createNotification,
    };
}
