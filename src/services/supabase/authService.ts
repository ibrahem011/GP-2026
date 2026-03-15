import { normalizeRole } from '@/lib/roles';
import { isMockModeEnabled, supabase } from './client';

export function createAuthService() {
    async function signIn(email: string, pass: string) {
        if (isMockModeEnabled()) {
            return {
                data: {
                    user: { id: 'mock-user-123', email: email || 'test@example.com' },
                    session: {
                        access_token: 'mock-token',
                        refresh_token: 'mock-refresh-token',
                        expires_in: 3600,
                        token_type: 'bearer',
                        user: { id: 'mock-user-123', email: email || 'test@example.com' }
                    }
                },
                error: null
            };
        }
        return await supabase.auth.signInWithPassword({ email, password: pass });
    }

    async function signUp(email: string, pass: string, data?: { full_name?: string; phone?: string; role?: string }) {
        if (isMockModeEnabled()) {
            return {
                data: {
                    user: { id: 'mock-user-123', email: email || 'test@example.com', user_metadata: data },
                    session: {
                        access_token: 'mock-token',
                        refresh_token: 'mock-refresh-token',
                        expires_in: 3600,
                        token_type: 'bearer',
                        user: { id: 'mock-user-123', email: email || 'test@example.com', user_metadata: data }
                    }
                },
                error: null
            };
        }
        const normalizedData = data
            ? {
                ...data,
                role: normalizeRole(data.role),
            }
            : data;

        return await supabase.auth.signUp({
            email,
            password: pass,
            options: { data: normalizedData }
        });
    }

    async function signOut() {
        if (isMockModeEnabled()) {
            return { error: null };
        }
        return await supabase.auth.signOut();
    }

    return {
        signIn,
        signUp,
        signOut,
    };
}
