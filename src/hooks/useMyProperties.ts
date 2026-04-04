import { useState, useEffect, useCallback } from 'react';
import type { Property, PropertyStatus } from '@/types';
import { getIsMockMode } from '@/config/constants';
import { supabaseService } from '@/services/supabaseService';
import { fromPropertyRow } from '@/lib/propertyMapper';

interface UseMyPropertiesCallbacks {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export function useMyProperties(userId: string | undefined, callbacks?: UseMyPropertiesCallbacks) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadProperties = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const TIMEOUT_MS = 15_000;
            const MAX_RETRIES = 2;

            let lastError: any = null;
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

                    const rows = await supabaseService.getProperties({ ownerId: userId });
                    clearTimeout(timer);

                    setProperties(rows.map(fromPropertyRow));
                    lastError = null;
                    break;
                } catch (err: any) {
                    lastError = err;
                    console.error(`Attempt ${attempt + 1} failed:`, err);

                    if (attempt < MAX_RETRIES - 1) {
                        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                    }
                }
            }

            if (lastError) {
                if (getIsMockMode()) {
                    const mockRows = await supabaseService.getProperties({ ownerId: userId });
                    setProperties(mockRows.map(fromPropertyRow));
                } else {
                    const isTimeout = lastError?.name === 'AbortError' || lastError?.message === 'TIMEOUT';
                    const msg = isTimeout
                        ? 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.'
                        : 'فشل تحميل العقارات. يرجى المحاولة لاحقاً.';
                    setError(msg);
                    setProperties([]);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadProperties();
    }, [loadProperties]);

    const deleteProperty = useCallback(async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا العقار؟')) return;

        setDeletingId(id);
        try {
            const success = await supabaseService.deleteProperty(id);
            if (success) {
                setProperties((prev) => prev.filter((p) => p.id !== id));
                callbacks?.onSuccess?.('تم حذف العقار بنجاح');
            } else {
                callbacks?.onError?.('فشل حذف العقار، يرجى المحاولة مرة أخرى');
            }
        } catch (err) {
            console.error('Error deleting property:', err);
            callbacks?.onError?.('فشل حذف العقار. يرجى المحاولة مرة أخرى.');
        } finally {
            setDeletingId(null);
        }
    }, [callbacks]);

    const updateStatus = useCallback(async (id: string, newStatus: PropertyStatus) => {
        try {
            const updated = await supabaseService.updateProperty(id, { status: newStatus });
            if (updated) {
                setProperties((prev) => 
                    prev.map((p) => (p.id === id ? fromPropertyRow(updated) : p))
                );
                callbacks?.onSuccess?.('تم تحديث حالة العقار بنجاح');
            } else {
                callbacks?.onError?.('فشل تحديث حالة العقار');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            callbacks?.onError?.('فشل تحديث حالة العقار');
        }
    }, [callbacks]);

    return {
        properties,
        loading,
        error,
        deletingId,
        refresh: loadProperties,
        deleteProperty,
        updateStatus,
    };
}
