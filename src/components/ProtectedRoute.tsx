'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthLoading from './AuthLoading';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();


    useEffect(() => {
        if (!loading && !isAuthenticated) {
            // Encode the current path to redirect back after login
            const currentPath = window.location.pathname + window.location.search;
            router.push(`/auth?mode=login&redirect=${encodeURIComponent(currentPath)}`);
        }
    }, [isAuthenticated, loading, router]);

    if (loading) {
        return <AuthLoading />;
    }

    if (!isAuthenticated) {
        return null; // Don't render anything while redirecting
    }

    return <>{children}</>;
}
