'use client';

import { useAuth } from '@/context/AuthContext';
import { isAdminRole } from '@/lib/roles';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface AdminGuardProps {
    children: ReactNode;
    requireSuperAdmin?: boolean;
}

export default function AdminGuard({ children, requireSuperAdmin = false }: AdminGuardProps) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    const hasAdminAccess = user?.isAdmin || isAdminRole(user?.role);
    const hasSuperAdminAccess = user?.isSuperAdmin;
    const isBlocked = user?.isBlocked;

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.push('/auth');
            } else if (isBlocked) {
                router.push('/');
            } else if (!hasAdminAccess) {
                router.push('/');
            } else if (requireSuperAdmin && !hasSuperAdminAccess) {
                router.push('/admin');
            }
        }
    }, [user, loading, isAuthenticated, router, hasAdminAccess, hasSuperAdminAccess, isBlocked, requireSuperAdmin]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                        <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">shield_person</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || isBlocked || !hasAdminAccess || (requireSuperAdmin && !hasSuperAdminAccess)) {
        return null;
    }

    return <>{children}</>;
}
