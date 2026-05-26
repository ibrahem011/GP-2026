import { useCallback, useEffect, useState } from 'react';
import type { Property, PropertyStatus } from '@/types';
import { getIsMockMode } from '@/config/constants';
import { isTimeoutLikeError, supabaseService } from '@/services/supabaseService';
import { fromPropertyRow } from '@/lib/propertyMapper';

interface UseMyPropertiesCallbacks {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

const LOAD_TIMEOUT_MS = 15_000;
const TIMEOUT_ERROR_MESSAGE = '\u0627\u0646\u062a\u0647\u062a \u0645\u0647\u0644\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.';
const GENERIC_ERROR_MESSAGE = '\u0641\u0634\u0644 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0644\u0627\u062d\u0642\u0627.';

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
            const rows = await supabaseService.getProperties({
                ownerId: userId,
                timeoutMs: LOAD_TIMEOUT_MS,
                maxRetries: 0,
                retryOnTimeout: false,
                operationKey: 'myProperties',
                logLevel: 'warn',
                throwOnError: true,
            });

            setProperties(rows.map(fromPropertyRow));
        } catch (err: any) {
            const timedOut = isTimeoutLikeError(err);

            if (timedOut) {
                console.warn('[useMyProperties] Properties request timed out.', {
                    code: err?.code ?? 'REQUEST_TIMEOUT',
                    operationKey: 'myProperties',
                    timeoutMs: LOAD_TIMEOUT_MS,
                });
            } else {
                console.error('[useMyProperties] Failed to load properties:', err);
            }

            if (getIsMockMode()) {
                const mockRows = await supabaseService.getProperties({ ownerId: userId });
                setProperties(mockRows.map(fromPropertyRow));
                return;
            }

            setError(timedOut ? TIMEOUT_ERROR_MESSAGE : GENERIC_ERROR_MESSAGE);
            setProperties([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadProperties();
    }, [loadProperties]);

    const deleteProperty = useCallback(async (id: string) => {
        setDeletingId(id);
        try {
            const success = await supabaseService.deleteProperty(id);
            if (success) {
                setProperties((prev) => prev.filter((p) => p.id !== id));
                callbacks?.onSuccess?.('\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0639\u0642\u0627\u0631 \u0628\u0646\u062c\u0627\u062d');
            } else {
                callbacks?.onError?.('\u0641\u0634\u0644 \u062d\u0630\u0641 \u0627\u0644\u0639\u0642\u0627\u0631\u060c \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649');
            }
        } catch (err) {
            console.error('Error deleting property:', err);
            callbacks?.onError?.('\u0641\u0634\u0644 \u062d\u0630\u0641 \u0627\u0644\u0639\u0642\u0627\u0631. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.');
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
                callbacks?.onSuccess?.('\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u0639\u0642\u0627\u0631 \u0628\u0646\u062c\u0627\u062d');
            } else {
                callbacks?.onError?.('\u0641\u0634\u0644 \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u0639\u0642\u0627\u0631');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            callbacks?.onError?.('\u0641\u0634\u0644 \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u0639\u0642\u0627\u0631');
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
