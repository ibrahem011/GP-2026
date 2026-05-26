'use client';

import { useCallback, useMemo } from 'react';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import type { User as AuthUser, UserRole } from '@/types';
import { normalizeRole } from '@/lib/roles';

export interface UserProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    role: UserRole;
    is_verified: boolean;
    is_admin: boolean;
    is_super_admin: boolean;
    is_blocked: boolean;
    blocked_at: string | null;
    blocked_reason: string | null;
    archived_at: string | null;
    archived_reason: string | null;
}

// Backward-compatible user type that matches the old interface.
export interface AppUser {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
    role: UserRole;
    nationalId?: string;
    isVerified: boolean;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
    isBlocked?: boolean;
    blockedAt?: string;
    blockedReason?: string;
    archivedAt?: string;
    archivedReason?: string;
    favorites: string[];
    unlockedProperties: string[];
    createdAt: string;
    lastLogin?: string;
    memberSince: string;
    authUser?: SupabaseAuthUser;
    profile?: UserProfile;
}

function toAppUser(user: AuthUser | null): AppUser | null {
    if (!user) {
        return null;
    }

    const role = normalizeRole(user.role);
    const createdAt = user.createdAt || new Date(0).toISOString();
    const memberSince = user.memberSince || createdAt;

    return {
        id: user.id,
        name: user.name || 'User',
        phone: user.phone || '',
        email: user.email,
        avatar: user.avatar,
        role,
        nationalId: user.nationalId,
        isVerified: user.isVerified || false,
        isAdmin: user.isAdmin || role === 'admin',
        isSuperAdmin: user.isSuperAdmin || false,
        isBlocked: user.isBlocked || false,
        blockedAt: user.blockedAt,
        blockedReason: user.blockedReason,
        archivedAt: user.archivedAt,
        archivedReason: user.archivedReason,
        favorites: user.favorites || [],
        unlockedProperties: user.unlockedProperties || [],
        createdAt,
        lastLogin: user.lastLogin,
        memberSince,
    };
}

export function useUser() {
    const { user, loading } = useAuth();
    const appUser = useMemo(() => toAppUser(user), [user]);

    const refreshUser = useCallback(async () => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('userUpdated'));
        }
    }, []);

    return { user: appUser, loading, refreshUser };
}
