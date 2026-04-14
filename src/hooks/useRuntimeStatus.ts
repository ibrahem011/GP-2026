'use client';

import { useEffect, useState } from 'react';
import { getIsMockMode } from '@/config/constants';

export function useRuntimeStatus() {
    const [isOnline, setIsOnline] = useState(() =>
        typeof navigator === 'undefined' ? true : navigator.onLine,
    );
    const [isMockMode] = useState(() => getIsMockMode());

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const updateOnlineStatus = () => {
            setIsOnline(window.navigator.onLine);
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    return {
        isOnline,
        isMockMode,
    };
}
