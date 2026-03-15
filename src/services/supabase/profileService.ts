import { normalizeRole } from '@/lib/roles';
import { isMockModeEnabled, supabase } from './client';
import { MOCK_PROFILES_BY_ID } from './mockData';
import type { UserProfile } from './types';

export function createProfileService() {
    async function getProfile(userId: string): Promise<UserProfile | null> {
        if (isMockModeEnabled()) {
            return {
                id: userId,
                full_name: 'ظ…ط³طھط®ط¯ظ… طھط¬ط±ظٹط¨ظٹ',
                avatar_url: null,
                phone: '01000000000',
                role: 'landlord',
                is_admin: true,
                is_verified: true
            };
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        if (!data) {
            return null;
        }

        const row = data as UserProfile & { role: string | null };
        return {
            ...row,
            role: normalizeRole(row.role),
        };
    }

    async function getAllProfiles(): Promise<any[]> {
        if (isMockModeEnabled()) {
            return [
                {
                    id: 'mock-user-123',
                    full_name: 'ظ…ط³طھط®ط¯ظ… طھط¬ط±ظٹط¨ظٹ',
                    email: 'test@example.com',
                    role: 'landlord',
                    is_verified: true,
                    created_at: new Date().toISOString()
                }
            ];
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching profiles:', error);
            return [];
        }
        return data;
    }

    async function getProfileById(userId: string): Promise<UserProfile | null> {
        if (isMockModeEnabled()) {
            return MOCK_PROFILES_BY_ID[userId] || null;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, phone, role, is_verified, is_admin')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile by id:', { userId, error });
            return null;
        }

        return (data as UserProfile | null) || null;
    }

    async function updateUserProfile(userId: string, updates: any) {
        if (isMockModeEnabled()) return { ...updates, id: userId };

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`ظپط´ظ„ طھط­ط¯ظٹط« ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ: ${error.message}`);
        }
        return data;
    }

    async function getProfilesCount(): Promise<number> {
        if (isMockModeEnabled()) {
            return 1;
        }

        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error fetching profiles count:', error);
            return 0;
        }
        return count || 0;
    }

    return {
        getProfile,
        getAllProfiles,
        getProfileById,
        updateUserProfile,
        getProfilesCount,
    };
}
