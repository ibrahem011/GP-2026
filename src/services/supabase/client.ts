import { supabase, STORAGE_BUCKET, uploadImage, deleteImage } from '@/lib/supabase';

export { supabase, STORAGE_BUCKET, uploadImage, deleteImage };

export function isMockModeEnabled(): boolean {
    const envMockMode = process.env.NEXT_PUBLIC_IS_MOCK_MODE === 'true';

    if (typeof window === 'undefined') {
        return envMockMode;
    }

    try {
        const localStorageValue = window.localStorage.getItem('DEV_MOCK_MODE');
        if (localStorageValue !== null) {
            return localStorageValue === 'true';
        }
    } catch {
        return envMockMode;
    }

    return envMockMode;
}

// Deprecated static export for UI compatibility. Use isMockModeEnabled() in service runtime paths.
export const IS_MOCK_MODE = isMockModeEnabled();
