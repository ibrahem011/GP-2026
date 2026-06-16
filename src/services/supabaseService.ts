import { supabase, STORAGE_BUCKET, uploadImage, deleteImage } from '@/lib/supabase';
import { signPathsWithServiceRole } from '@/lib/serverSupabase';
import {
    compareFeaturedPropertyRows,
    compareRecentPropertyRows,
    type PropertyCollection,
} from '@/lib/propertyCollections';
import { normalizePropertyImageList } from '@/lib/propertyImages';
import {
    STORAGE_BUCKETS,
    type StorageBucketName,
    buildStorageObjectPath,
    isDisplayableUrl,
    toStorageReference,
} from '@/lib/storagePaths';
import { Conversation, Message, Profile } from '@/types/messaging';
import type { PublicBookingPeriod, TenantPropertyState, UserRole } from '@/types';
import { normalizeRole } from '@/lib/roles';

import { getIsMockMode } from '@/config/constants';
export { getIsMockMode };

// --- RESILIENCE HELPERS ---
export interface RequestResilienceOptions {
    timeoutMs?: number;
    maxRetries?: number;
    signal?: AbortSignal;
    retryOnTimeout?: boolean;
    operationKey?: string;
}

export interface CreateFullPropertyOptions extends RequestResilienceOptions {
    onStageChange?: (stage: 'preparing' | 'uploading' | 'saving') => void;
}

export interface ProfileStats {
    properties: number;
    unlocked: number;
    favorites: number;
}

export interface ProfileStatsResult {
    stats: ProfileStats;
    error: any;
    isTimeout: boolean;
}

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const REQUEST_CIRCUIT_TIMEOUT_THRESHOLD = 3;
const REQUEST_CIRCUIT_WINDOW_MS = 30_000;
const REQUEST_CIRCUIT_OPEN_MS = 30_000;

type RequestCircuitState = {
    timeoutTimestamps: number[];
    openUntil: number;
};

const requestCircuitState = new Map<string, RequestCircuitState>();
const EMPTY_PROFILE_STATS: ProfileStats = {
    properties: 0,
    unlocked: 0,
    favorites: 0,
};

export async function withTimeout<T>(promise: Promise<T>, timeoutMs?: number, signal?: AbortSignal): Promise<T> {
    const ms = timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            const err: any = new Error('REQUEST_TIMEOUT');
            err.name = 'TimeoutError';
            err.code = 'REQUEST_TIMEOUT';
            reject(err);
        }, ms);

        const onAbort = () => {
            clearTimeout(timer);
            const err: any = new Error('Request aborted');
            err.name = 'AbortError';
            reject(err);
        };

        if (signal) {
            if (signal.aborted) return onAbort();
            signal.addEventListener('abort', onAbort);
        }

        promise.then(
            (val) => {
                clearTimeout(timer);
                if (signal) signal.removeEventListener('abort', onAbort);
                resolve(val);
            },
            (err) => {
                clearTimeout(timer);
                if (signal) signal.removeEventListener('abort', onAbort);
                reject(err);
            }
        );
    });
}

export function isTimeoutLikeError(error: any) {
    return error?.code === 'REQUEST_TIMEOUT' || error?.name === 'AbortError' || error?.message?.toLowerCase().includes('timeout');
}

function getRequestCircuit(operationKey?: string): RequestCircuitState | null {
    if (!operationKey) {
        return null;
    }

    const existing = requestCircuitState.get(operationKey);
    if (existing) {
        return existing;
    }

    const state = { timeoutTimestamps: [], openUntil: 0 };
    requestCircuitState.set(operationKey, state);
    return state;
}

function pruneCircuitTimeouts(state: RequestCircuitState, now: number) {
    state.timeoutTimestamps = state.timeoutTimestamps.filter((timestamp) => now - timestamp <= REQUEST_CIRCUIT_WINDOW_MS);
}

function isRequestCircuitOpen(operationKey?: string, now = Date.now()) {
    const state = getRequestCircuit(operationKey);
    if (!state) {
        return false;
    }

    if (state.openUntil <= now) {
        state.openUntil = 0;
        pruneCircuitTimeouts(state, now);
        return false;
    }

    return true;
}

function recordRequestTimeout(operationKey?: string, now = Date.now()) {
    const state = getRequestCircuit(operationKey);
    if (!state) {
        return false;
    }

    pruneCircuitTimeouts(state, now);
    state.timeoutTimestamps.push(now);

    if (state.timeoutTimestamps.length >= REQUEST_CIRCUIT_TIMEOUT_THRESHOLD) {
        state.openUntil = now + REQUEST_CIRCUIT_OPEN_MS;
        return true;
    }

    return false;
}

function clearRequestCircuit(operationKey?: string) {
    if (operationKey) {
        requestCircuitState.delete(operationKey);
    }
}

export function resetRequestResilienceStateForTests() {
    requestCircuitState.clear();
}

export async function fetchWithRetry<T>(fn: () => Promise<T>, options?: RequestResilienceOptions): Promise<T> {
    const maxRetries = Math.max(0, options?.maxRetries ?? 0);
    const retryOnTimeout = options?.retryOnTimeout === true;
    const operationKey = options?.operationKey;
    let attempt = 0;
    while (true) {
        try {
            const result = await withTimeout(fn(), options?.timeoutMs, options?.signal);
            clearRequestCircuit(operationKey);
            return result;
        } catch (error) {
            const isTimeout = isTimeoutLikeError(error);
            const openedCircuit = isTimeout ? recordRequestTimeout(operationKey) : false;
            const circuitOpen = isTimeout ? isRequestCircuitOpen(operationKey) : false;
            const canRetry = isTimeout && retryOnTimeout && attempt < maxRetries && !circuitOpen;

            if (!canRetry) {
                if (isTimeout && retryOnTimeout && maxRetries > 0 && (circuitOpen || openedCircuit)) {
                    console.warn('[fetchWithRetry] Retry skipped while circuit is open.', {
                        operationKey,
                        attempt,
                        timeoutMs: options?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
                    });
                }
                throw error;
            }

            attempt++;
            console.warn('[fetchWithRetry] Retrying timed-out request.', {
                operationKey,
                attempt,
                maxRetries,
                timeoutMs: options?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
            });
            await new Promise(res => setTimeout(res, 1000 * attempt));
        }
    }
}

export function createCreateFullPropertyError(code: string, message: string, originalError?: any) {
    const err: any = new Error(message);
    err.code = code;
    err.originalError = originalError;
    return err;
}
// --- END RESILIENCE HELPERS ---



const getGlobal = () => {
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    return {} as any;
};

const g = getGlobal();

const shouldShortCircuitMock = (): boolean => {
    if (g.__TEST_MOCK_OVERRIDE__ !== undefined && g.__TEST_MOCK_OVERRIDE__ !== null) {
        return g.__TEST_MOCK_OVERRIDE__;
    }
    return getIsMockMode() && process.env.NODE_ENV !== 'test';
};

const PUBLIC_BOOKING_PERIODS_RPC_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_BOOKING_PERIODS_RPC === 'true';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UNLOCK_FEE = 50;
const STORAGE_SIGN_TTL_SECONDS = 60 * 5;
let publicBookingPeriodsRpcAvailable = PUBLIC_BOOKING_PERIODS_RPC_ENABLED;

type GetPropertiesLogLevel = 'error' | 'warn' | 'silent';

export interface GetPropertiesFilters extends RequestResilienceOptions {
    status?: string;
    category?: string;
    area?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    features?: string[];
    ownerId?: string;
    q?: string;
    collection?: PropertyCollection;
    limit?: number;
    offset?: number;
    logLevel?: GetPropertiesLogLevel;
    throwOnError?: boolean;
}

type PropertyQueryErrorLike = {
    message?: string;
    code?: string;
    hint?: string;
    details?: string;
};

function createAbortSignalWithTimeout(timeoutMs?: number, externalSignal?: AbortSignal) {
    if (typeof timeoutMs !== 'number' || timeoutMs <= 0) {
        return {
            signal: externalSignal,
            cleanup: () => undefined,
            didTimeout: () => false,
        };
    }

    const controller = new AbortController();
    let timedOut = false;
    const handleTimeout = () => {
        timedOut = true;
        controller.abort();
    };
    const timeoutId = setTimeout(handleTimeout, timeoutMs);
    const handleExternalAbort = () => controller.abort();

    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            externalSignal.addEventListener('abort', handleExternalAbort, { once: true });
        }
    }

    return {
        signal: controller.signal,
        cleanup: () => {
            clearTimeout(timeoutId);
            externalSignal?.removeEventListener('abort', handleExternalAbort);
        },
        didTimeout: () => timedOut,
    };
}

function isAbortLikeQueryFailure(error: PropertyQueryErrorLike | null | undefined): boolean {
    const haystack = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    return haystack.includes('aborterror')
        || haystack.includes('aborted')
        || haystack.includes('timeout')
        || haystack.includes('timed out');
}

function sanitizeGetPropertiesFilters(filters?: GetPropertiesFilters) {
    if (!filters) {
        return undefined;
    }

    const { signal, ...safeFilters } = filters;
    return safeFilters;
}

function logGetPropertiesFailure(
    error: PropertyQueryErrorLike,
    filters: GetPropertiesFilters | undefined,
    timedOut: boolean,
) {
    const logLevel = filters?.logLevel ?? (timedOut || isAbortLikeQueryFailure(error) ? 'warn' : 'error');
    if (logLevel === 'silent') {
        return;
    }

    const logger = logLevel === 'warn' ? console.warn : console.error;
    logger('Error fetching properties:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
        timedOut,
        filters: sanitizeGetPropertiesFilters(filters),
    });
}

type UnlockablePayment = {
    id: string;
    amount: number;
    is_consumed: boolean | null;
};

type TenantPropertyBookingRow = {
    id: string;
    start_date: string;
    end_date: string;
    status: 'pending' | 'requested' | 'confirmed' | 'active' | 'cancelled' | 'completed' | 'rejected' | 'expired';
    created_at: string;
};

type UserBookingsRpcRow = {
    booking_id: string;
    booking_property_id: string;
    booking_user_id: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    created_at: string;
    tenant_name: string | null;
    booking_type: 'tenant' | 'owner';
    prop_id: string | null;
    prop_title: string | null;
    prop_images: string[] | null;
    prop_area: string | null;
    prop_owner_id: string | null;
    prop_owner_name: string | null;
    prop_owner_phone: string | null;
    profile_id: string | null;
    profile_full_name: string | null;
    profile_avatar_url: string | null;
};

type FavoriteReferenceRow = {
    property_id: string;
    created_at: string;
};

type UserBookingsFallbackRow = {
    id: string;
    property_id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    created_at: string;
    tenant_name: string | null;
    property: {
        id: string;
        title: string | null;
        images: string[] | null;
        area: string | null;
        owner_id: string | null;
        owner_name: string | null;
        owner_phone: string | null;
    } | null;
    user?: {
        id: string | null;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
};

type PaymentRequestListRow = {
    id: string;
    user_id: string;
    property_id: string;
    amount: number;
    payment_method: 'vodafone_cash' | 'instapay' | 'fawry';
    receipt_image: string | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    created_at: string;
    is_consumed?: boolean | null;
    processed_at?: string | null;
    properties?: {
        title?: string | null;
    } | null;
    profiles?: {
        full_name?: string | null;
    } | null;
};

const FAVORITES_PROPERTY_SELECT = `
    id,
    owner_id,
    title,
    description,
    price,
    price_unit,
    category,
    status,
    images,
    location_lat,
    location_lng,
    address,
    area,
    bedrooms,
    bathrooms,
    floor_area,
    floor_number,
    features,
    owner_phone,
    owner_name,
    is_verified,
    views_count,
    created_at,
    updated_at
`;

const isBrowserRuntime = () => typeof window !== 'undefined';

function createRandomStorageName(fileName: string | undefined, fallbackExtension: string): string {
    const fileExt = fileName?.split('.').pop()?.trim() || fallbackExtension;
    return `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
}

async function getCurrentAuthUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
        throw new Error(`Failed to load authenticated user: ${error.message}`);
    }

    if (!data.user?.id) {
        throw new Error('Authenticated user is required for this action.');
    }

    return data.user.id;
}

async function createSignedUrlMapWithClient(
    bucket: StorageBucketName,
    paths: string[],
): Promise<Map<string, string>> {
    const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
    if (uniquePaths.length === 0) {
        return new Map<string, string>();
    }

    try {
        const bucketClient: any = supabase.storage.from(bucket);
        const signedUrlMap = new Map<string, string>();

        if (typeof bucketClient.createSignedUrls === 'function') {
            const { data, error } = await bucketClient.createSignedUrls(uniquePaths, STORAGE_SIGN_TTL_SECONDS);

            if (error) {
                return signedUrlMap;
            }

            for (const [index, item] of (data || []).entries()) {
                const path = item.path || uniquePaths[index];
                if (path && item.signedUrl) {
                    signedUrlMap.set(path, item.signedUrl);
                }
            }

            return signedUrlMap;
        }

        if (typeof bucketClient.createSignedUrl === 'function') {
            for (const path of uniquePaths) {
                const { data, error } = await bucketClient.createSignedUrl(path, STORAGE_SIGN_TTL_SECONDS);
                if (!error && data?.signedUrl) {
                    signedUrlMap.set(path, data.signedUrl);
                }
            }
            return signedUrlMap;
        }
    } catch (error) {
        console.error(`Error creating signed URLs for ${bucket}:`, error);
    }

    return new Map<string, string>();
}

async function createPropertySignedUrlMapWithRoute(paths: string[]): Promise<Map<string, string>> {
    if (!isBrowserRuntime()) {
        return new Map<string, string>();
    }

    try {
        const response = await fetch('/api/storage/sign-property-images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paths }),
        });

        if (!response.ok) {
            return new Map<string, string>();
        }

        const body = await response.json().catch(() => ({}));
        const urls = body?.urls && typeof body.urls === 'object' ? body.urls : {};
        return new Map<string, string>(Object.entries(urls));
    } catch (error) {
        console.error('Error signing property images through Next route:', error);
        return new Map<string, string>();
    }
}

async function createSignedUrlMap(
    bucket: StorageBucketName,
    paths: string[],
): Promise<Map<string, string>> {
    const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
    if (uniquePaths.length === 0) {
        return new Map<string, string>();
    }

    if (!isBrowserRuntime()) {
        try {
            return await signPathsWithServiceRole(bucket, uniquePaths, STORAGE_SIGN_TTL_SECONDS);
        } catch (error) {
            console.error(`Error creating server-side signed URLs for ${bucket}:`, error);
            return new Map<string, string>();
        }
    }

    const clientSignedUrls = await createSignedUrlMapWithClient(bucket, uniquePaths);

    if (bucket !== STORAGE_BUCKETS.propertiesImages) {
        return clientSignedUrls;
    }

    const missingPaths = uniquePaths.filter((path) => !clientSignedUrls.has(path));
    if (missingPaths.length === 0) {
        return clientSignedUrls;
    }

    const routeSignedUrls = await createPropertySignedUrlMapWithRoute(missingPaths);
    for (const [path, url] of routeSignedUrls.entries()) {
        clientSignedUrls.set(path, url);
    }

    return clientSignedUrls;
}

async function resolveStorageValues(
    values: Array<string | null | undefined>,
    bucket: StorageBucketName,
): Promise<Array<string | null>> {
    const references = values.map((value) => toStorageReference(value, bucket));
    const paths = references.flatMap((reference) => (reference.path ? [reference.path] : []));
    const signedUrlMap = await createSignedUrlMap(bucket, paths);

    return references.map((reference) => {
        if (!reference.original) {
            return null;
        }

        if (reference.path) {
            const signedUrl = signedUrlMap.get(reference.path);
            if (signedUrl) {
                return signedUrl;
            }

            if (reference.passthrough && isDisplayableUrl(reference.passthrough)) {
                return reference.passthrough;
            }

            return null;
        }

        if (reference.passthrough && isDisplayableUrl(reference.passthrough)) {
            return reference.passthrough;
        }

        return null;
    });
}

async function resolveStorageValue(
    value: string | null | undefined,
    bucket: StorageBucketName,
): Promise<string | null> {
    const [resolvedValue] = await resolveStorageValues([value], bucket);
    return resolvedValue || null;
}

async function hydratePropertyRows(rows: PropertyRow[]): Promise<PropertyRow[]> {
    const rawImages = rows.flatMap((row) => row.images || []);
    const signedImages = await resolveStorageValues(rawImages, STORAGE_BUCKETS.propertiesImages);

    let imageIndex = 0;

    return rows.map((row) => ({
        ...row,
        images: normalizePropertyImageList(
            (row.images || []).map(() => {
                const resolved = signedImages[imageIndex];
                imageIndex += 1;
                return resolved || '';
            }),
        ),
    }));
}

async function hydratePropertyRow(row: PropertyRow | null): Promise<PropertyRow | null> {
    if (!row) {
        return null;
    }

    const [hydratedRow] = await hydratePropertyRows([row]);
    return hydratedRow || null;
}

async function hydrateBookingsWithPropertyImages<T extends {
    property?: {
        images?: string[] | null;
    } | null;
}>(bookings: T[]): Promise<T[]> {
    const rawImages = bookings.flatMap((booking) => booking.property?.images || []);
    const signedImages = await resolveStorageValues(rawImages, STORAGE_BUCKETS.propertiesImages);

    let imageIndex = 0;

    return bookings.map((booking) => {
        if (!booking.property) {
            return booking;
        }

        return {
            ...booking,
            property: {
                ...booking.property,
                images: normalizePropertyImageList(
                    (booking.property.images || []).map(() => {
                        const resolved = signedImages[imageIndex];
                        imageIndex += 1;
                        return resolved || '';
                    }),
                ),
            },
        };
    });
}

function normalizePropertyRowImages<T extends { images?: string[] | null }>(row: T): T {
    return {
        ...row,
        images: normalizePropertyImageList(row.images || []),
    };
}

function isMissingRpcFunctionError(error: any, functionName: string): boolean {
    if (!error) return false;

    const code = typeof error.code === 'string' ? error.code : '';
    const message = typeof error.message === 'string' ? error.message : '';
    const details = typeof error.details === 'string' ? error.details : '';
    const hint = typeof error.hint === 'string' ? error.hint : '';

    if (code === 'PGRST202') {
        return true;
    }

    return [message, details, hint].some((value) => value.includes(functionName));
}

async function getFavoritesFallback(userId: string): Promise<{ data: PropertyRow[]; error: any }> {
    const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('property_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (favoritesError) {
        return { data: [], error: favoritesError };
    }

    const propertyIds = ((favoritesData || []) as FavoriteReferenceRow[]).map((row) => row.property_id);

    if (propertyIds.length === 0) {
        return { data: [], error: null };
    }

    const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(FAVORITES_PROPERTY_SELECT)
        .in('id', propertyIds);

    if (propertiesError) {
        return { data: [], error: propertiesError };
    }

    const propertiesById = new Map(
        ((propertiesData || []) as PropertyRow[]).map((property) => [property.id, property])
    );

    const orderedProperties = propertyIds
        .map((propertyId) => propertiesById.get(propertyId) || null)
        .filter((property): property is PropertyRow => property !== null);

    return { data: await hydratePropertyRows(orderedProperties), error: null };
}

function mapFallbackBookingRow(
    row: UserBookingsFallbackRow,
    bookingType: 'tenant' | 'owner'
) {
    return {
        id: row.id,
        propertyId: row.property_id,
        userId: row.user_id,
        startDate: row.start_date,
        endDate: row.end_date,
        totalAmount: row.total_amount,
        status: row.status,
        createdAt: row.created_at,
        tenantName: row.tenant_name,
        bookingType,
        property: {
            id: row.property?.id || null,
            title: row.property?.title || null,
            images: row.property?.images || [],
            area: row.property?.area || null,
            ownerId: row.property?.owner_id || null,
            ownerName: row.property?.owner_name || null,
            ownerPhone: row.property?.owner_phone || null,
        },
        user: bookingType === 'owner'
            ? {
                id: row.user?.id || row.user_id,
                fullName: row.user?.full_name || row.tenant_name,
                avatarUrl: row.user?.avatar_url || null,
            }
            : null,
    };
}

async function getUserBookingsFallback(userId: string): Promise<{ bookings: any[]; error: any; isTimeout?: boolean }> {
    const { data: tenantRows, error: tenantError } = await supabase
        .from('bookings')
        .select(`
            id,
            property_id,
            user_id,
            start_date,
            end_date,
            total_amount,
            status,
            created_at,
            tenant_name,
            property:properties (
                id,
                title,
                images,
                area,
                owner_id,
                owner_name,
                owner_phone
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (tenantError) {
        return { bookings: [], error: tenantError };
    }

    const { data: ownerRows, error: ownerError } = await supabase
        .from('bookings')
        .select(`
            id,
            property_id,
            user_id,
            start_date,
            end_date,
            total_amount,
            status,
            created_at,
            tenant_name,
            property:properties!inner (
                id,
                title,
                images,
                area,
                owner_id,
                owner_name,
                owner_phone
            ),
            user:profiles (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('property.owner_id', userId)
        .order('created_at', { ascending: false });

    if (ownerError) {
        return { bookings: [], error: ownerError };
    }

    const bookings = [
        ...(((tenantRows || []) as unknown) as UserBookingsFallbackRow[]).map((row) => mapFallbackBookingRow(row, 'tenant')),
        ...(((ownerRows || []) as unknown) as UserBookingsFallbackRow[]).map((row) => mapFallbackBookingRow(row, 'owner')),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { bookings: await hydrateBookingsWithPropertyImages(bookings), error: null };
}

async function countRowsByEquality(
    table: string,
    selectColumn: string,
    filterColumn: string,
    filterValue: string,
): Promise<number> {
    const { count, error } = await (supabase
        .from(table)
        .select(selectColumn, { count: 'exact', head: true })
        .eq(filterColumn, filterValue) as any);

    if (error) {
        throw error;
    }

    return typeof count === 'number' ? count : 0;
}

function normalizeDateOnly(value: string): string | null {
    if (!value) return null;

    const trimmed = value.trim();
    const maybeDateOnly = DATE_ONLY_REGEX.test(trimmed) ? trimmed : trimmed.split('T')[0];

    if (!DATE_ONLY_REGEX.test(maybeDateOnly)) return null;

    const [year, month, day] = maybeDateOnly.split('-').map(Number);
    const candidate = new Date(Date.UTC(year, month - 1, day));

    if (
        candidate.getUTCFullYear() !== year ||
        candidate.getUTCMonth() + 1 !== month ||
        candidate.getUTCDate() !== day
    ) {
        return null;
    }

    return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function buildBookingSystemMessage(startDate: string, endDate: string): string {
    return `تم إرسال طلب حجز جديد للفترة من ${startDate} إلى ${endDate}.`;
}

async function getApprovedUnlockPayment(
    userId: string,
    propertyId: string,
    paymentId?: string
): Promise<UnlockablePayment> {
    let query = supabase
        .from('payment_requests')
        .select('id, amount, is_consumed')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .eq('status', 'approved')
        .or('is_consumed.eq.false,is_consumed.is.null');

    if (paymentId) {
        query = query.eq('id', paymentId);
    }

    const { data: rawPayment, error: paymentError } = await query.maybeSingle();
    const payment = rawPayment as UnlockablePayment | null;

    if (paymentError) {
        throw new Error(`ط®ط·ط£ ظپظٹ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¯ظپط¹: ${paymentError.message}`);
    }

    if (!payment) {
        throw new Error('ظ„ط§ ظٹظˆط¬ط¯ ط¯ظپط¹ ظ…ط¹طھظ…ط¯ ظ„ظ‡ط°ط§ ط§ظ„ط¹ظ‚ط§ط±');
    }

    if (payment.amount < UNLOCK_FEE) {
        throw new Error(
            `ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط¯ظپظˆط¹ (${payment.amount} ط¬ظ†ظٹظ‡) ط£ظ‚ظ„ ظ…ظ† ط§ظ„ط±ط³ظˆظ… ط§ظ„ظ…ط·ظ„ظˆط¨ط© (${UNLOCK_FEE} ط¬ظ†ظٹظ‡)`
        );
    }

    if (payment.is_consumed === null) {
        const { error: normalizeError } = await supabase
            .from('payment_requests')
            .update({ is_consumed: false })
            .eq('id', payment.id);

        if (normalizeError) {
            throw new Error(`Failed to normalize payment consumption state: ${normalizeError.message}`);
        }
    }

    return payment;
}

// ط£ظ†ظˆط§ط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ
export interface UserProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    role: UserRole;
    is_verified: boolean;
    is_admin: boolean;
}

import type { PropertyCategory, PriceUnit, PropertyStatus } from '@/types/database.types';

export interface PropertyInsert {
    title: string;
    description?: string | null;
    price: number;
    price_unit?: PriceUnit;
    category: PropertyCategory;
    location_lat?: number | null;
    location_lng?: number | null;
    address?: string;
    area?: string;
    bedrooms?: number;
    bathrooms?: number;
    floor_area?: number | null;
    floor_number?: number;
    features?: string[];
    owner_phone?: string;
    owner_name?: string;
}

export interface PropertyRow extends PropertyInsert {
    id: string;
    owner_id: string;
    status: PropertyStatus;
    images: string[];
    is_verified: boolean;
    views_count: number;
    created_at: string;
    updated_at: string;
}

// === Mock Data ===
const MOCK_PROPERTIES: PropertyRow[] = [
    {
        id: '1',
        title: 'ط´ظ‚ط© ظپط§ط®ط±ط© طھط·ظ„ ط¹ظ„ظ‰ ط§ظ„ط¨ط­ط±',
        description: 'ط´ظ‚ط© ط±ط§ط¦ط¹ط© ط¨ظپظٹظˆ ظ…ط¨ط§ط´ط± ط¹ظ„ظ‰ ط§ظ„ط¨ط­ط±طŒ ظ…ظƒظˆظ†ط© ظ…ظ† 3 ط؛ط±ظپ ظˆطµط§ظ„ط© ظƒط¨ظٹط±ط©. طھط´ط·ظٹط¨ ط³ظˆط¨ط± ظ„ظˆظƒط³ ظˆظ…ط¬ظ‡ط²ط© ط¨ط§ظ„ظƒط§ظ…ظ„.',
        price: 1500,
        price_unit: 'day',
        category: 'apartment',
        address: 'ط´ط§ط±ط¹ ط§ظ„ط¨ط­ط±طŒ ط¬ظ…طµط©',
        area: 'ظ…ظ†ط·ظ‚ط© ط§ظ„ظپظٹظ„ط§طھ',
        bedrooms: 3,
        bathrooms: 2,
        floor_area: 120,
        floor_number: 2,
        features: ['ظˆط§ظٹ ظپط§ظٹ', 'طھظƒظٹظٹظپ', 'ط´ط±ظپط©', 'ظ…ط·ط¨ط® ظ…ط¬ظ‡ط²', 'ظ…طµط¹ط¯'],
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
        owner_id: 'owner-1',
        owner_name: 'ط§ظ„ط­ط§ط¬ ظ…ط­ظ…ط¯',
        owner_phone: '01012345678',
        status: 'available',
        is_verified: true,
        views_count: 150,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '2',
        title: 'ط´ط§ظ„ظٹط© ط£ط±ط¶ظٹ ط¨ط­ط¯ظٹظ‚ط© ط®ط§طµط©',
        description: 'ط´ط§ظ„ظٹط© ط¬ظ…ظٹظ„ ظ‚ط±ظٹط¨ ظ…ظ† ط§ظ„ط³ظˆظ‚ ظˆظ…ظ†ط·ظ‚ط© ط§ظ„ظ…ط·ط§ط¹ظ…. ط¨ظ‡ ط­ط¯ظٹظ‚ط© ط®ط§طµط© ظˆظ…ط¯ط®ظ„ ظ…ط³طھظ‚ظ„.',
        price: 800,
        price_unit: 'day',
        category: 'chalet',
        address: 'ظ…ظ†ط·ظ‚ط© 15 ظ…ط§ظٹظˆ',
        area: '15 ظ…ط§ظٹظˆ',
        bedrooms: 2,
        bathrooms: 1,
        floor_area: 80,
        floor_number: 0,
        features: ['ط­ط¯ظٹظ‚ط©', 'ظ‚ط±ظٹط¨ ظ…ظ† ط§ظ„ط®ط¯ظ…ط§طھ', 'ظ…ظˆظ‚ظپ ط³ظٹط§ط±ط§طھ'],
        images: ['https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=800&q=80'],
        owner_id: 'owner-2',
        owner_name: 'ط£ظ… ظƒط±ظٹظ…',
        owner_phone: '01122334455',
        status: 'available',
        is_verified: true,
        views_count: 85,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '3',
        title: 'ط³طھظˆط¯ظٹظˆ ط§ظ‚طھطµط§ط¯ظٹ ظ„ظ„ط·ظ„ط§ط¨',
        description: 'ط³طھظˆط¯ظٹظˆ طµط؛ظٹط± ظˆظ…ط±ظٹط­طŒ ظ…ظ†ط§ط³ط¨ ظ„ظ„ط·ظ„ط§ط¨ ط£ظˆ ط§ظ„ط£ظپط±ط§ط¯. ظ‚ط±ظٹط¨ ظ…ظ† ط§ظ„ط¬ط§ظ…ط¹ط©.',
        price: 3000,
        price_unit: 'month',
        category: 'studio',
        address: 'ط­ظٹ ط§ظ„ط´ط¨ط§ط¨',
        area: 'طھظ‚ط³ظٹظ… ط§ظ„ط´ط¨ط§ط¨',
        bedrooms: 1,
        bathrooms: 1,
        floor_area: 40,
        floor_number: 3,
        features: ['ط³ط±ظٹط±', 'ظ…ظƒطھط¨', 'ط¯ظˆظ„ط§ط¨'],
        images: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80'],
        owner_id: 'owner-1',
        owner_name: 'ط§ظ„ط­ط§ط¬ ظ…ط­ظ…ط¯',
        owner_phone: '01012345678',
        status: 'available',
        is_verified: false,
        views_count: 40,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '4',
        title: 'ظپظٹظ„ط§ ظ…ط³طھظ‚ظ„ط© ظ„ظ„ط¹ط§ط¦ظ„ط§طھ ط§ظ„ظƒط¨ظٹط±ط©',
        description: 'ظپظٹظ„ط§ ط¯ظˆط±ظٹظ† ط¨ط­ط¯ظٹظ‚ط© ظˆط­ظ…ط§ظ… ط³ط¨ط§ط­ط©طŒ طھظƒظپظٹ ط¹ط§ط¦ظ„ط© ظƒط¨ظٹط±ط©. ظ‚ط±ظٹط¨ط© ظ…ظ† ط§ظ„ط¨ط­ط±.',
        price: 5000,
        price_unit: 'day',
        category: 'villa',
        address: 'ظ…ظ†ط·ظ‚ط© ط§ظ„ظپظٹظ„ط§طھ ط§ظ„ط¬ط¯ظٹط¯ط©',
        area: 'ظ…ظ†ط·ظ‚ط© ط§ظ„ظپظٹظ„ط§طھ',
        bedrooms: 5,
        bathrooms: 4,
        floor_area: 300,
        floor_number: 0,
        features: ['ط­ظ…ط§ظ… ط³ط¨ط§ط­ط©', 'ط­ط¯ظٹظ‚ط© ظƒط¨ظٹط±ط©', 'ط¬ط±ط§ط¬', 'طھظƒظٹظٹظپ ظ…ط±ظƒط²ظٹ'],
        images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'],
        owner_id: 'owner-3',
        owner_name: 'ط¯. ظ…ط­ظ…ظˆط¯',
        owner_phone: '01233445566',
        status: 'available',
        is_verified: true,
        views_count: 320,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

// In-memory storage for mock mode changes (resets on refresh)
const _mockFavorites = new Set<string>();
const _mockUnlocked = new Set<string>();

export const supabaseService = {
    async respondToBookingRequest(bookingId: string, action: string, landlordNote?: string): Promise<{ success: boolean; error: any }> {
        if (shouldShortCircuitMock()) {
            return { success: true, error: null };
        }

        const trimmedNote = landlordNote?.trim() || null;
        const { error } = await supabase.rpc('transition_booking_status', {
            p_booking_id: bookingId,
            p_action: action,
            p_landlord_note: trimmedNote,
        });
        return { success: !error, error };
    },
    // ====== Mock Auth Hub ======
    async signIn(email: string, pass: string) {
        if (shouldShortCircuitMock()) {
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
    },

    async signUp(email: string, pass: string, data?: { full_name?: string; phone?: string; role?: string }) {
        if (shouldShortCircuitMock()) {
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
    },

    async signOut() {
        if (shouldShortCircuitMock()) {
            return { error: null };
        }
        return await supabase.auth.signOut();
    },

    async getProfile(userId: string): Promise<UserProfile | null> {
        if (shouldShortCircuitMock()) {
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
            console.error('Error fetching profile:', {
                message: error.message,
                code: error.code,
                hint: error.hint,
                details: error.details,
            });
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
    },

    // ====== ط±ظپط¹ ط§ظ„طµظˆط± ======
    async uploadPropertyImages(files: File[], userId: string): Promise<string[]> {
        if (shouldShortCircuitMock()) {
            // Return fake cloud URLs
            return files.map(() => `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=800&q=80`);
        }

        const uploadedPaths: string[] = [];
        for (const file of files) {
            try {
                const path = await uploadImage(file, `${userId}/`);
                uploadedPaths.push(path);
            } catch (error: any) {
                console.error('Error uploading image:', {
                    message: error.message,
                    code: error.code,
                    hint: error.hint,
                    details: error.details,
                    error // Log full error just in case it's not a PostgrestError
                });
                throw error;
            }
        }
        return uploadedPaths;
    },

    // ====== ط­ط°ظپ ط§ظ„طµظˆط± ======
    async deletePropertyImage(pathOrUrl: string): Promise<void> {
        if (shouldShortCircuitMock()) return;
        await deleteImage(pathOrUrl);
    },



    // ====== ط§ظ„ط¹ظ‚ط§ط±ط§طھ ======
    async createFullProperty(
        propertyData: PropertyInsert,
        imageFiles: File[],
        userId: string,
        options?: CreateFullPropertyOptions
    ): Promise<PropertyRow> {
        if (shouldShortCircuitMock()) {
            const newProp: PropertyRow = {
                ...propertyData,
                id: Math.random().toString(36).substr(2, 9),
                owner_id: userId,
                images: await this.uploadPropertyImages(imageFiles, userId),
                status: 'pending',
                is_verified: false,
                views_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            MOCK_PROPERTIES.unshift(newProp);
            return newProp;
        }

        try {
            // 1. ط±ظپط¹ ط§ظ„طµظˆط± ط£ظˆظ„ط§ظ‹
            let imagePaths: string[] = [];
            if (imageFiles.length > 0) {
                imagePaths = await this.uploadPropertyImages(imageFiles, userId);
            }

            // 2. ط­ظپط¸ ط§ظ„ط¹ظ‚ط§ط± ظپظٹ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
            const { data, error } = await supabase
                .from('properties')
                .insert({
                    ...propertyData,
                    owner_id: userId,
                    images: imagePaths,
                    status: 'pending',
                })
                .select()
                .single();

            if (error) {
                for (const path of imagePaths) {
                    await this.deletePropertyImage(path);
                }
                throw new Error(`ظپط´ظ„ ط­ظپط¸ ط§ظ„ط¹ظ‚ط§ط±: ${error.message}`);
            }

            return (await hydratePropertyRow(data as PropertyRow)) as PropertyRow;
        } catch (error: any) {
            console.error('Error in createFullProperty:', {
                message: error.message,
                code: error.code,
                hint: error.hint,
                details: error.details,
                error
            });
            throw error;
        }
    },

    async getProperties(filters?: GetPropertiesFilters): Promise<PropertyRow[]> {
        if (shouldShortCircuitMock()) {
            let filtered = [...MOCK_PROPERTIES];
            if (filters?.status) filtered = filtered.filter(p => p.status === filters.status);
            if (filters?.category) filtered = filtered.filter(p => p.category === filters.category);
            if (filters?.area && filters.area !== 'ط§ظ„ظƒظ„') filtered = filtered.filter(p => p.area === filters.area);
            if (filters?.minPrice) filtered = filtered.filter(p => p.price >= filters.minPrice!);
            if (filters?.maxPrice) filtered = filtered.filter(p => p.price <= filters.maxPrice!);
            if (filters?.bedrooms) filtered = filtered.filter(p => (p.bedrooms || 0) >= filters.bedrooms!);
            if (filters?.bathrooms) filtered = filtered.filter(p => (p.bathrooms || 0) >= filters.bathrooms!);
            if (filters?.ownerId) filtered = filtered.filter(p => p.owner_id === filters.ownerId);
            if (filters?.q) {
                const normalizedQuery = filters.q.trim().toLowerCase();
                filtered = filtered.filter((property) =>
                    property.title.toLowerCase().includes(normalizedQuery) ||
                    (property.address || '').toLowerCase().includes(normalizedQuery) ||
                    (property.area || '').toLowerCase().includes(normalizedQuery),
                );
            }
            if (filters?.collection === 'featured') {
                filtered = filtered.filter((property) => property.is_verified);
                filtered.sort(compareFeaturedPropertyRows);
            } else {
                filtered.sort(compareRecentPropertyRows);
            }
            if (typeof filters?.offset === 'number' || typeof filters?.limit === 'number') {
                const start = Math.max(filters?.offset ?? 0, 0);
                const end = typeof filters?.limit === 'number' ? start + filters.limit : undefined;
                filtered = filtered.slice(start, end);
            }
            return filtered.map((property) => normalizePropertyRowImages(property));
        }

        let query = supabase
            .from('properties')
            .select('*');

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.category) query = query.eq('category', filters.category);
        if (filters?.area && filters.area !== 'ط§ظ„ظƒظ„') query = query.eq('area', filters.area);
        if (filters?.minPrice) query = query.gte('price', filters.minPrice);
        if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);
        if (filters?.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
        if (filters?.bathrooms) query = query.gte('bathrooms', filters.bathrooms);
        if (filters?.features && filters.features.length > 0) query = query.contains('features', filters.features);
        if (filters?.ownerId) query = query.eq('owner_id', filters.ownerId);
        if (filters?.q?.trim()) {
            const searchQuery = filters.q.trim();
            query = query.or(`title.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,area.ilike.%${searchQuery}%`);
        }
        if (filters?.collection === 'featured') {
            query = query
                .eq('is_verified', true)
                .order('views_count', { ascending: false })
                .order('created_at', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }
        if (typeof filters?.limit === 'number') {
            const offset = Math.max(filters.offset ?? 0, 0);
            query = query.range(offset, offset + filters.limit - 1);
        }

        const timeout = createAbortSignalWithTimeout(filters?.timeoutMs, filters?.signal);
        if (timeout.signal && typeof query.abortSignal === 'function') {
            query = query.abortSignal(timeout.signal);
        }

        try {
            return await fetchWithRetry(async () => {
                const { data, error } = await query;
                if (error) {
                    throw error;
                }

                return await hydratePropertyRows((data || []) as PropertyRow[]);
            }, {
                timeoutMs: filters?.timeoutMs,
                maxRetries: filters?.maxRetries,
                signal: filters?.signal,
                retryOnTimeout: filters?.retryOnTimeout,
                operationKey: filters?.operationKey ?? 'getProperties',
            });
        } catch (error: any) {
            logGetPropertiesFailure({
                message: error?.message,
                code: error?.code,
                hint: error?.hint,
                details: error?.details || error?.stack,
            }, filters, timeout.didTimeout() || isTimeoutLikeError(error));

            if (filters?.throwOnError) {
                throw error;
            }

            return [];
        } finally {
            timeout.cleanup();
        }
    },

    async getPropertyById(id: string): Promise<PropertyRow | null> {
        if (shouldShortCircuitMock()) {
            const property = MOCK_PROPERTIES.find(p => p.id === id) || null;
            return property ? normalizePropertyRowImages(property) : null;
        }

        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching property:', {
                id,
                message: error.message,
                code: error.code,
                hint: error.hint,
                details: error.details,
            });
            return null;
        }
        return await hydratePropertyRow(data as PropertyRow);
    },

    async incrementPropertyViews(id: string): Promise<void> {
        if (shouldShortCircuitMock()) return;

        const { error } = await supabase.rpc('increment_views', { property_id: id });
        if (error) {
            const property = await this.getPropertyById(id);
            if (property) {
                await supabase
                    .from('properties')
                    .update({ views_count: property.views_count + 1 })
                    .eq('id', id);
            }
        }
    },

    async updateProperty(id: string, updates: Partial<PropertyRow>): Promise<PropertyRow | null> {
        if (shouldShortCircuitMock()) {
            const idx = MOCK_PROPERTIES.findIndex(p => p.id === id);
            if (idx !== -1) {
                MOCK_PROPERTIES[idx] = { ...MOCK_PROPERTIES[idx], ...updates };
                return normalizePropertyRowImages(MOCK_PROPERTIES[idx]);
            }
            return null;
        }

        const { data, error } = await supabase
            .from('properties')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating property:', error);
            return null;
        }
        return await hydratePropertyRow(data as PropertyRow);
    },

    async deleteProperty(id: string): Promise<boolean> {
        if (shouldShortCircuitMock()) {
            const idx = MOCK_PROPERTIES.findIndex(p => p.id === id);
            if (idx !== -1) {
                MOCK_PROPERTIES.splice(idx, 1);
                return true;
            }
            return false;
        }

        const property = await this.getPropertyById(id);
        if (property?.images && property.images.length > 0) {
            await Promise.all(property.images.map((url) => this.deletePropertyImage(url)));
        }

        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);

        return !error;
    },

    // ====== ط§ظ„ظ…ظپط¶ظ„ط© ======
    async getFavorites(userId: string, options?: RequestResilienceOptions): Promise<{ data: PropertyRow[]; error: any; isTimeout?: boolean }> {
        if (shouldShortCircuitMock()) {
            const favoriteProperties = Array.from(_mockFavorites)
                .map((id) => MOCK_PROPERTIES.find((property) => property.id === id) || null)
                .filter((property): property is PropertyRow => property !== null);

            return { data: favoriteProperties, error: null };
        }

        try {
            const rows = await fetchWithRetry(async () => {
                const { data, error } = await supabase
                    .rpc('get_user_favorites', { uid: userId });

                if (error) {
                    if (isMissingRpcFunctionError(error, 'get_user_favorites')) {
                        const fallback = await getFavoritesFallback(userId);
                        if (fallback.error) {
                            throw fallback.error;
                        }
                        return fallback.data as any;
                    }
                    throw error;
                }

                return await hydratePropertyRows((data || []) as PropertyRow[]);
            }, {
                operationKey: 'getFavorites',
                ...options,
            });

            return { data: rows, error: null, isTimeout: false };
        } catch (error: any) {
            if (isMissingRpcFunctionError(error, 'get_user_favorites')) {
                 const fallback = await getFavoritesFallback(userId);
                 return fallback as any;
            }
            if (isTimeoutLikeError(error)) {
                console.warn('[getFavorites] Request timed out after retry budget.');
                return {
                    data: [],
                    error: { code: 'REQUEST_TIMEOUT', message: 'REQUEST_TIMEOUT' },
                    isTimeout: true,
                };
            }

            console.error('[getFavorites Unexpected Error]', error);
            return { data: [], error, isTimeout: false };
        }
    },

    async toggleFavorite(userId: string, propertyId: string): Promise<boolean> {
        if (shouldShortCircuitMock()) {
            if (_mockFavorites.has(propertyId)) {
                _mockFavorites.delete(propertyId);
                return false;
            } else {
                _mockFavorites.add(propertyId);
                return true;
            }
        }

        const { count } = await supabase
            .from('favorites')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('property_id', propertyId);

        const existing = (count ?? 0) > 0;

        if (existing) {
            await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('property_id', propertyId);
            return false;
        } else {
            await supabase
                .from('favorites')
                .insert({ user_id: userId, property_id: propertyId });
            return true;
        }
    },

    // ====== ط§ظ„ط¹ظ‚ط§ط±ط§طھ ط§ظ„ظ…ظپطھظˆط­ط© ======
    async getUnlockedProperties(userId: string): Promise<string[]> {
        if (shouldShortCircuitMock()) {
            return Array.from(_mockUnlocked);
        }

        const { data, error } = await supabase
            .from('unlocked_properties')
            .select('property_id')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching unlocked properties:', error);
            return [];
        }

        return data.map(u => u.property_id);
    },

    async getProfileStats(userId: string, options?: RequestResilienceOptions): Promise<ProfileStatsResult> {
        if (shouldShortCircuitMock()) {
            return {
                stats: {
                    properties: MOCK_PROPERTIES.filter((property) => property.owner_id === userId).length,
                    unlocked: _mockUnlocked.size,
                    favorites: _mockFavorites.size,
                },
                error: null,
                isTimeout: false,
            };
        }

        try {
            const stats = await fetchWithRetry(async () => {
                const [properties, unlocked, favorites] = await Promise.all([
                    countRowsByEquality('properties', 'id', 'owner_id', userId),
                    countRowsByEquality('unlocked_properties', 'property_id', 'user_id', userId),
                    countRowsByEquality('favorites', 'property_id', 'user_id', userId),
                ]);

                return { properties, unlocked, favorites };
            }, {
                operationKey: 'profileStats',
                ...options,
            });

            return { stats, error: null, isTimeout: false };
        } catch (error: any) {
            if (isTimeoutLikeError(error)) {
                console.warn('[getProfileStats] Request timed out after retry budget.');
                return {
                    stats: { ...EMPTY_PROFILE_STATS },
                    error: { code: 'REQUEST_TIMEOUT', message: 'REQUEST_TIMEOUT' },
                    isTimeout: true,
                };
            }

            console.error('[getProfileStats Unexpected Error]', error);
            return { stats: { ...EMPTY_PROFILE_STATS }, error, isTimeout: false };
        }
    },

    async isPropertyUnlocked(userId: string, propertyId: string): Promise<boolean> {
        if (shouldShortCircuitMock()) {
            return _mockUnlocked.has(propertyId);
        }

        const { count } = await supabase
            .from('unlocked_properties')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('property_id', propertyId);

        return (count ?? 0) > 0;
    },

    async getPublicBookingPeriods(propertyId: string): Promise<PublicBookingPeriod[]> {
        if (shouldShortCircuitMock()) {
            return [];
        }

        if (!publicBookingPeriodsRpcAvailable) {
            return [];
        }

        const { data, error } = await supabase.rpc('get_public_property_booking_periods', {
            p_property_id: propertyId,
        });

        if (error) {
            const rpcError = error as {
                code?: string;
                message?: string;
                details?: string;
                hint?: string;
            };

            const isMissingRpc =
                rpcError.code === 'PGRST202' ||
                rpcError.code === '404' ||
                rpcError.message?.includes('get_public_property_booking_periods') ||
                rpcError.details?.includes('get_public_property_booking_periods') ||
                rpcError.hint?.includes('get_public_property_booking_periods');

            if (isMissingRpc) {
                publicBookingPeriodsRpcAvailable = false;
            }

            if (!isMissingRpc) {
                console.error('Error fetching public booking periods:', {
                    code: rpcError.code,
                    message: rpcError.message,
                    details: rpcError.details,
                    hint: rpcError.hint,
                });
            }

            return [];
        }

        return ((data || []) as Array<{ start_date: string; end_date: string }>).map((period) => ({
            startDate: period.start_date,
            endDate: period.end_date,
        }));
    },

    async getTenantPropertyState(userId: string, propertyId: string): Promise<TenantPropertyState> {
        if (shouldShortCircuitMock()) {
            return {
                unlockedAt: _mockUnlocked.has(propertyId) ? new Date().toISOString() : null,
                unlockRequestStatus: _mockUnlocked.has(propertyId) ? 'approved' : 'none',
                latestBooking: null,
                hasBookingHistory: false,
            };
        }

        const [
            { data: unlockData, error: unlockError },
            { data: bookingData, error: bookingError },
            { data: paymentData, error: paymentError },
        ] = await Promise.all([
            supabase
                .from('unlocked_properties')
                .select('unlocked_at')
                .eq('user_id', userId)
                .eq('property_id', propertyId)
                .maybeSingle(),
            supabase
                .from('bookings')
                .select('id, start_date, end_date, status, created_at')
                .eq('user_id', userId)
                .eq('property_id', propertyId)
                .order('created_at', { ascending: false })
                .limit(1),
            supabase
                .from('payment_requests')
                .select('status')
                .eq('user_id', userId)
                .eq('property_id', propertyId)
                .order('created_at', { ascending: false })
                .limit(1),
        ]);

        if (unlockError) {
            console.error('Error fetching unlocked property state:', unlockError);
        }

        if (bookingError) {
            console.error('Error fetching tenant booking state:', bookingError);
        }

        if (paymentError) {
            console.error('Error fetching unlock payment state:', paymentError);
        }

        const latestBookingRow = ((bookingData || [])[0] || null) as TenantPropertyBookingRow | null;
        const latestPaymentStatus = ((paymentData || [])[0] as { status?: 'pending' | 'approved' | 'rejected' } | undefined)?.status;

        return {
            unlockedAt: unlockData?.unlocked_at || null,
            unlockRequestStatus: latestPaymentStatus || 'none',
            latestBooking: latestBookingRow
                ? {
                    id: latestBookingRow.id,
                    startDate: latestBookingRow.start_date,
                    endDate: latestBookingRow.end_date,
                    status: latestBookingRow.status,
                    createdAt: latestBookingRow.created_at,
                }
                : null,
            hasBookingHistory: Boolean(latestBookingRow),
        };
    },

    async unlockProperty(userId: string, propertyId: string, paymentId?: string): Promise<void> {
        if (shouldShortCircuitMock()) {
            _mockUnlocked.add(propertyId);
            return;
        }

        if (!userId || !propertyId) {
            throw new Error('userId and propertyId are required');
        }

        try {
            const payment = await getApprovedUnlockPayment(userId, propertyId, paymentId);

            // âœ… STEP 2: Check if already unlocked
            const { count: unlockedCount } = await supabase
                .from('unlocked_properties')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('property_id', propertyId);

            if ((unlockedCount ?? 0) > 0) {
                throw new Error('ط§ظ„ط¹ظ‚ط§ط± ظ…ظپطھظˆط­ ط¨ط§ظ„ظپط¹ظ„');
            }
            // âœ… STEP 3: Atomic operation - mark payment consumed + unlock property
            const { error: unlockError } = await supabase.rpc('unlock_property_with_payment', {
                p_user_id: userId,
                p_property_id: propertyId,
                p_payment_id: payment.id
            });

            if (unlockError) {
                throw new Error(`ظپط´ظ„ ظپطھط­ ط§ظ„ط¹ظ‚ط§ط±: ${unlockError.message}`);
            }

        } catch (error: any) {
            console.error('Error unlocking property:', error);
            throw error;
        }
    },

    async approvePaymentAndUnlock(paymentId: string, userId: string, propertyId: string): Promise<void> {
        if (shouldShortCircuitMock()) {
            _mockUnlocked.add(propertyId);
            return;
        }

        if (!paymentId) {
            throw new Error('paymentId is required');
        }

        try {
            const { error } = await supabase.rpc('approve_payment_request_and_unlock', {
                p_payment_id: paymentId,
            });

            if (error) {
                throw new Error(`Failed to approve payment request: ${error.message}`);
            }
        } catch (error: any) {
            console.error('Error approving payment request:', error);
            throw error;
        }
    },

    // ====== ط·ظ„ط¨ط§طھ ط§ظ„ط¯ظپط¹ ======
    async createPaymentRequest(params: {
        userId: string;
        propertyId: string;
        amount: number;
        paymentMethod: 'vodafone_cash' | 'instapay' | 'fawry';
        receiptImage?: string;
    }): Promise<void> {
        if (shouldShortCircuitMock()) {
            return;
        }

        const { error } = await supabase
            .from('payment_requests')
            .insert({
                user_id: params.userId,
                property_id: params.propertyId,
                amount: params.amount,
                payment_method: params.paymentMethod,
                receipt_image: params.receiptImage,
            });

        if (error) {
            throw new Error(`ظپط´ظ„ ط¥ط±ط³ط§ظ„ ط·ظ„ط¨ ط§ظ„ط¯ظپط¹: ${error.message}`);
        }
    },

    async uploadUnlockPaymentReceipt(
        propertyId: string,
        userId: string,
        receiptFile: File,
    ): Promise<string> {
        if (shouldShortCircuitMock()) {
            return 'https://example.com/mock-unlock-receipt.jpg';
        }

        const objectPath = buildStorageObjectPath(
            userId,
            `unlock-${propertyId}`,
            createRandomStorageName(receiptFile.name, 'jpg'),
        );

        const { error } = await supabase.storage
            .from(STORAGE_BUCKETS.paymentReceipts)
            .upload(objectPath, receiptFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            throw new Error(`Failed to upload unlock receipt: ${error.message}`);
        }

        return objectPath;
    },

    async getPaymentRequests(filters?: { status?: string }): Promise<any[]> {
        if (shouldShortCircuitMock()) {
            return [];
        }

        let query = supabase
            .from('payment_requests')
            .select(`
                *,
                properties:property_id(title),
                profiles:user_id(full_name)
            `)
            .order('created_at', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching payment requests:', error);
            return [];
        }
        const rows = (data || []) as PaymentRequestListRow[];
        const signedReceipts = await resolveStorageValues(
            rows.map((row) => row.receipt_image),
            STORAGE_BUCKETS.paymentReceipts,
        );

        return rows.map((row, index) => ({
            ...row,
            receipt_image: signedReceipts[index] || row.receipt_image,
            property_title: row.properties?.title || null,
            user_name: row.profiles?.full_name || null,
        }));
    },

    async rejectPaymentRequest(paymentId: string): Promise<void> {
        if (shouldShortCircuitMock()) {
            return;
        }

        const { error } = await supabase
            .from('payment_requests')
            .update({
                status: 'rejected',
                processed_at: new Date().toISOString(),
            })
            .eq('id', paymentId);

        if (error) {
            throw new Error(`Failed to reject payment request: ${error.message}`);
        }
    },

    async getPaymentRequestsCount(filters?: { status?: string }): Promise<number> {
        if (shouldShortCircuitMock()) {
            return 0;
        }

        let query = supabase
            .from('payment_requests')
            .select('*', { count: 'exact', head: true });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        const { count, error } = await query;
        if (error) {
            console.error('Error fetching payment requests count:', error);
            return 0;
        }
        return count || 0;
    },

    async getProfilesCount(): Promise<number> {
        if (shouldShortCircuitMock()) {
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
    },

    // ====== ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ ======
    async getNotifications(userId: string): Promise<{
        id: string;
        title: string;
        message: string | null;
        type: string;
        is_read: boolean;
        link: string | null;
        created_at: string;
    }[]> {
        if (shouldShortCircuitMock()) {
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
    },

    async markNotificationAsRead(notificationId: string): Promise<void> {
        if (shouldShortCircuitMock()) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
    },

    async markAllNotificationsAsRead(userId: string): Promise<void> {
        if (shouldShortCircuitMock()) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId);
    },

    async createNotification(params: {
        userId: string;
        title: string;
        message: string;
        type: 'success' | 'info' | 'warning' | 'error';
        link?: string;
    }): Promise<void> {
        if (shouldShortCircuitMock()) {
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
    },

    // ====== ط§ظ„طھظ‚ظٹظٹظ…ط§طھ ======
    async getReviewsForProperty(propertyId: string): Promise<{
        id: string;
        user_id: string;
        rating: number;
        comment: string | null;
        created_at: string;
    }[]> {
        if (shouldShortCircuitMock()) {
            return [
                {
                    id: 'review-1',
                    user_id: 'user-2',
                    rating: 5,
                    comment: 'ط¹ظ‚ط§ط± ظ…ظ…طھط§ط² ظˆظ†ط¸ظٹظپ ط¬ط¯ط§ظ‹طŒ ظˆط§ظ„ظ…ط§ظ„ظƒ ظ…طھط¹ط§ظˆظ†.',
                    created_at: new Date().toISOString()
                }
            ];
        }

        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
        return data || [];
    },

    async addReview(params: {
        propertyId: string;
        userId: string;
        rating: number;
        comment?: string;
    }): Promise<void> {
        if (shouldShortCircuitMock()) {
            return;
        }

        const { error } = await supabase
            .from('reviews')
            .insert({
                property_id: params.propertyId,
                user_id: params.userId,
                rating: params.rating,
                comment: params.comment,
            });

        if (error) {
            throw new Error(`ظپط´ظ„ ط¥ط¶ط§ظپط© ط§ظ„طھظ‚ظٹظٹظ…: ${error.message}`);
        }
    },

    // ====== ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† (Admin) ======
    async getAllProfiles(): Promise<any[]> {
        if (shouldShortCircuitMock()) {
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
    },

    async getProfileById(userId: string): Promise<UserProfile | null> {
        if (shouldShortCircuitMock()) {
            const mockProfiles: Record<string, UserProfile> = {
                'mock-user-123': {
                    id: 'mock-user-123',
                    full_name: 'مستخدم تجريبي',
                    avatar_url: null,
                    phone: '01000000000',
                    role: 'landlord',
                    is_verified: true,
                    is_admin: false,
                },
                'owner-1': {
                    id: 'owner-1',
                    full_name: 'الحاج محمد',
                    avatar_url: null,
                    phone: '01012345678',
                    role: 'landlord',
                    is_verified: true,
                    is_admin: false,
                },
                'owner-2': {
                    id: 'owner-2',
                    full_name: 'أم كريم',
                    avatar_url: null,
                    phone: '01122334455',
                    role: 'landlord',
                    is_verified: true,
                    is_admin: false,
                },
                'owner-3': {
                    id: 'owner-3',
                    full_name: 'د. محمود',
                    avatar_url: null,
                    phone: '01233445566',
                    role: 'landlord',
                    is_verified: true,
                    is_admin: false,
                },
            };

            return mockProfiles[userId] || null;
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
    },

    async updateUserProfile(userId: string, updates: any) {
        if (shouldShortCircuitMock()) return { ...updates, id: userId };

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
    },

    // ====== ظ†ط¸ط§ظ… ط§ظ„ظ…ط­ط§ط¯ط«ط© (Messaging) ======
    async createConversation(params: {
        propertyId: string;
        buyerId: string;
        ownerId: string;
    }): Promise<string> {
        if (shouldShortCircuitMock()) return 'mock-conv-1';

        // Avoid duplicate rows when React Strict Mode triggers double renders or when two
        // clients start a chat simultaneously. We first try to read the existing row (but
        // tolerate the "no rows" error), then fall back to inserting, and finally handle
        // the unique-constraint error by returning the existing id.
        const { data: existing, error: fetchError } = await supabase
            .from('conversations')
            .select('id')
            .eq('property_id', params.propertyId)
            .eq('buyer_id', params.buyerId)
            .eq('owner_id', params.ownerId)
            .maybeSingle();

        // Any error other than "no rows" should surface instead of causing a blind insert.
        if (fetchError && fetchError.code !== 'PGRST116') {
            throw new Error(`فشل جلب المحادثة: ${fetchError.message}`);
        }

        if (existing) return existing.id;

        const { data, error } = await supabase
            .from('conversations')
            .insert({
                property_id: params.propertyId,
                buyer_id: params.buyerId,
                owner_id: params.ownerId,
            })
            .select('id')
            .single();

        // 23505 = unique_violation. If another request inserted the same row just before us,
        // fetch and reuse that conversation instead of failing.
        if (error) {
            if (error.code === '23505') {
                const { data: dup } = await supabase
                    .from('conversations')
                    .select('id')
                    .eq('property_id', params.propertyId)
                    .eq('buyer_id', params.buyerId)
                    .eq('owner_id', params.ownerId)
                    .maybeSingle();

                if (dup?.id) return dup.id;
            }

            throw new Error(`فشل بدء المحادثة: ${error.message}`);
        }

        return data.id;
    },

    async getUserConversations(userId: string) {
        if (shouldShortCircuitMock()) {
            return [
                {
                    id: 'mock-conv-1',
                    property_id: '1',
                    buyer_id: userId,
                    owner_id: 'owner-1',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    property: MOCK_PROPERTIES[0],
                    buyer: { full_name: 'ظ…ط³طھط®ط¯ظ… طھط¬ط±ظٹط¨ظٹ', avatar_url: null },
                    owner: { full_name: 'ط§ظ„ط­ط§ط¬ ظ…ط­ظ…ط¯', avatar_url: null },
                    last_message: { text: 'ظ‡ظ„ ط§ظ„ط¹ظ‚ط§ط± ظ„ط§ ظٹط²ط§ظ„ ظ…طھط§ط­ط§ظ‹طں', created_at: new Date().toISOString(), is_read: false, sender_id: userId }
                }
            ];
        }

        // Use parameterized filters to prevent injection (no string interpolation in .or())
        const { data: asBuyer, error: errBuyer } = await supabase
            .from('conversations')
            .select(`
                *,
                property:properties(title, images),
                buyer:profiles!buyer_id(full_name, avatar_url),
                owner:profiles!owner_id(full_name, avatar_url),
                last_message:messages(text, created_at, is_read, sender_id, media_url, message_type)
            `)
            .eq('buyer_id', userId)
            .order('updated_at', { ascending: false });

        const { data: asOwner, error: errOwner } = await supabase
            .from('conversations')
            .select(`
                *,
                property:properties(title, images),
                buyer:profiles!buyer_id(full_name, avatar_url),
                owner:profiles!owner_id(full_name, avatar_url),
                last_message:messages(text, created_at, is_read, sender_id, media_url, message_type)
            `)
            .eq('owner_id', userId)
            .order('updated_at', { ascending: false });

        const error = errBuyer || errOwner;
        const data = [...(asBuyer || []), ...(asOwner || [])]
            .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        if (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }

        const conversations = data.map((conv: any) => ({
            ...conv,
            last_message: conv.last_message?.[0] || null
        }));

        const propertyImages = conversations.flatMap((conv: any) => conv.property?.images || []);
        const signedPropertyImages = await resolveStorageValues(
            propertyImages,
            STORAGE_BUCKETS.propertiesImages,
        );
        const lastMessageMedia = await resolveStorageValues(
            conversations.map((conv: any) => conv.last_message?.media_url || null),
            STORAGE_BUCKETS.chatImages,
        );
        const lastVoiceMedia = await resolveStorageValues(
            conversations.map((conv: any) => conv.last_message?.message_type === 'voice' ? conv.last_message?.media_url || null : null),
            STORAGE_BUCKETS.voiceNotes,
        );

        let propertyImageIndex = 0;
        let lastMessageIndex = 0;

        return conversations.map((conv: any) => {
            const messageIndex = conv.last_message ? lastMessageIndex++ : -1;

            return {
                ...conv,
                property: conv.property
                    ? {
                        ...conv.property,
                        images: (conv.property.images || []).map(() => {
                            const resolved = signedPropertyImages[propertyImageIndex];
                            propertyImageIndex += 1;
                            return resolved || '';
                        }).filter(Boolean),
                    }
                    : conv.property,
                last_message: conv.last_message
                    ? {
                        ...conv.last_message,
                        media_url: conv.last_message.message_type === 'voice'
                            ? lastVoiceMedia[messageIndex] || lastMessageMedia[messageIndex] || conv.last_message.media_url || null
                            : lastMessageMedia[messageIndex] || conv.last_message.media_url || null,
                    }
                    : null,
            };
        });
    },

    async getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
        if (shouldShortCircuitMock()) {
            return [
                {
                    id: 'msg-1',
                    conversation_id: conversationId,
                    sender_id: 'mock-user-123',
                    text: 'ط§ظ„ط³ظ„ط§ظ… ط¹ظ„ظٹظƒظ…طŒ ظ‡ظ„ ط§ظ„ط´ظ‚ط© ظ…طھط§ط­ط©طں',
                    created_at: new Date(Date.now() - 100000).toISOString(),
                    is_read: true,
                    message_type: 'text'
                },
                {
                    id: 'msg-2',
                    conversation_id: conversationId,
                    sender_id: 'owner-1',
                    text: 'ظˆط¹ظ„ظٹظƒظ… ط§ظ„ط³ظ„ط§ظ…طŒ ظ†ط¹ظ… ظ…طھط§ط­ط© ظٹط§ ظپظ†ط¯ظ….',
                    created_at: new Date(Date.now() - 50000).toISOString(),
                    is_read: false,
                    message_type: 'text'
                }
            ];
        }

        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:profiles(full_name, avatar_url)')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        const messages = (data || []).reverse() as any[];
        const signedChatMedia = await resolveStorageValues(
            messages.map((message) => message.message_type === 'image' ? message.media_url || null : null),
            STORAGE_BUCKETS.chatImages,
        );
        const signedVoiceMedia = await resolveStorageValues(
            messages.map((message) => message.message_type === 'voice' ? message.media_url || null : null),
            STORAGE_BUCKETS.voiceNotes,
        );

        return messages.map((message, index) => ({
            ...message,
            media_url: message.message_type === 'voice'
                ? signedVoiceMedia[index] || message.media_url || null
                : signedChatMedia[index] || message.media_url || null,
        }));
    },

    async sendMessage(params: {
        conversationId: string;
        senderId: string;
        text?: string;
        messageType?: 'text' | 'voice' | 'image' | 'system';
        mediaUrl?: string;
        duration?: number;
        metadata?: any;
    }) {
        if (shouldShortCircuitMock()) {
            return;
        }

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: params.conversationId,
                sender_id: params.senderId,
                text: params.text,
                message_type: params.messageType || 'text',
                media_url: params.mediaUrl,
                duration: params.duration,
                metadata: params.metadata
            });

        if (error) throw new Error(`ظپط´ظ„ ط¥ط±ط³ط§ظ„ ط§ظ„ط±ط³ط§ظ„ط©: ${error.message}`);

        await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', params.conversationId);
    },

    async markMessagesAsRead(conversationId: string, userId: string) {
        if (shouldShortCircuitMock()) return;

        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .eq('is_read', false);
    },

    // ====== Voice Notes & Media ======
    async uploadVoiceNote(audioBlob: Blob, conversationId: string): Promise<string> {
        if (shouldShortCircuitMock()) {
            return 'https://example.com/mock-voice.mp3';
        }

        const senderId = await getCurrentAuthUserId();
        const objectPath = buildStorageObjectPath(
            conversationId,
            senderId,
            createRandomStorageName('voice.webm', 'webm'),
        );
        const { error } = await supabase.storage
            .from(STORAGE_BUCKETS.voiceNotes)
            .upload(objectPath, audioBlob, { contentType: 'audio/webm' });

        if (error) throw new Error(`ظپط´ظ„ ط±ظپط¹ ط§ظ„ط±ط³ط§ظ„ط© ط§ظ„طµظˆطھظٹط©: ${error.message}`);

        return objectPath;
    },

    async uploadChatImage(imageFile: File, conversationId: string): Promise<string> {
        if (shouldShortCircuitMock()) {
            return 'https://example.com/mock-image.jpg';
        }

        const senderId = await getCurrentAuthUserId();
        const objectPath = buildStorageObjectPath(
            conversationId,
            senderId,
            createRandomStorageName(imageFile.name, 'jpg'),
        );
        const { error } = await supabase.storage
            .from(STORAGE_BUCKETS.chatImages)
            .upload(objectPath, imageFile);

        if (error) throw new Error(`ظپط´ظ„ ط±ظپط¹ ط§ظ„طµظˆط±ط©: ${error.message}`);

        return objectPath;
    },

    // ====== Media Permissions ======
    async requestMediaPermission(conversationId: string, userId: string): Promise<void> {
        if (shouldShortCircuitMock()) {
            return;
        }

        await supabase
            .from('conversations')
            .update({ media_permission_status: 'requested' })
            .eq('id', conversationId);

        // Send system message
        await this.sendMessage({
            conversationId,
            senderId: userId,
            text: '', // Will be handled by message_type
            messageType: 'system',
            metadata: { type: 'media_permission_request' }
        });
    },

    async grantMediaPermission(conversationId: string): Promise<void> {
        if (shouldShortCircuitMock()) return;

        await supabase
            .from('conversations')
            .update({ media_permission_status: 'granted' })
            .eq('id', conversationId);
    },

    async denyMediaPermission(conversationId: string): Promise<void> {
        if (shouldShortCircuitMock()) return;

        await supabase
            .from('conversations')
            .update({ media_permission_status: 'denied' })
            .eq('id', conversationId);
    },

    async getConversationDetails(conversationId: string): Promise<any> {
        if (shouldShortCircuitMock()) {
            return {
                id: conversationId,
                property_id: '1',
                tenant_id: 'mock-user-123',
                owner_id: 'owner-1',
                media_permission_status: 'none',
                property: MOCK_PROPERTIES[0]
            };
        }

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                property:properties(*),
                buyer:profiles!buyer_id(full_name, avatar_url, online_status, is_verified),
                owner:profiles!owner_id(full_name, avatar_url, online_status, is_verified)
            `)
            .eq('id', conversationId)
            .single();

        if (error) {
            console.error('Error fetching conversation details:', error);
            return null;
        }

        const signedProperty = await hydratePropertyRow((data.property || null) as PropertyRow | null);

        return {
            ...data,
            property: signedProperty,
        };
    },

    // ====== Real-time Presence & Typing ======
    async updateOnlineStatus(userId: string, status: boolean) {
        if (shouldShortCircuitMock()) return;

        const { error } = await supabase
            .from('profiles')
            .update({
                online_status: status,
                last_seen: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) console.error('Error updating online status:', error);
    },

    async sendTypingIndicator(conversationId: string, isTyping: boolean) {
        const channel = supabase.channel(`typing-${conversationId}`);
        await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { isTyping }
        });
    },

    subscribeToTypingIndicator(conversationId: string, callback: (isTyping: boolean) => void) {
        const channel = supabase.channel(`typing-${conversationId}`)
            .on(
                'broadcast',
                { event: 'typing' },
                (payload) => callback(payload.payload.isTyping)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    async uploadMedia(file: File, type: 'image' | 'voice', conversationId: string): Promise<string> {
        if (type === 'image') {
            return this.uploadChatImage(file, conversationId);
        } else {
            // Assuming voice files are Blobs or Files
            return this.uploadVoiceNote(file, conversationId);
        }
    },

    // ====== ظ†ط¸ط§ظ… ط§ظ„ط­ط¬ط² ط§ظ„ظ…طھظ‚ط¯ظ… ======

    /**
     * ط­ط³ط§ط¨ ط§ظ„ط³ط¹ط± ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ظ„ظ„ط­ط¬ط²
     */
    calculateTotalPrice(
        rentalConfig: import('@/types').RentalConfig,
        startDate: Date,
        endDate: Date
    ): {
        basePrice: number;
        serviceFee: number;
        depositAmount: number;
        totalAmount: number;
        duration: number;
    } {
        const { type, pricePerUnit, seasonalConfig } = rentalConfig;
        let duration = 0;
        let basePrice = 0;
        let depositAmount = 0;

        switch (type) {
            case 'daily':
                // ط­ط³ط§ط¨ ط¹ط¯ط¯ ط§ظ„ظ„ظٹط§ظ„ظٹ
                duration = Math.ceil(
                    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                basePrice = duration * pricePerUnit;
                break;

            case 'monthly':
                // ط­ط³ط§ط¨ ط¹ط¯ط¯ ط§ظ„ط£ط´ظ‡ط± (طھظ‚ط±ظٹط¨ظٹ: 30 ظٹظˆظ… = ط´ظ‡ط±)
                const days = Math.ceil(
                    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                duration = Math.ceil(days / 30);
                basePrice = duration * pricePerUnit;
                break;

            case 'seasonal':
                // ط§ظ„ظپطھط±ط© ط§ظ„ط¯ط±ط§ط³ظٹط© ط«ط§ط¨طھط©: 10 ط£ط´ظ‡ط±
                duration = 10;
                basePrice = duration * pricePerUnit;

                // ط§ظ„طھط£ظ…ظٹظ† ط¥ط°ط§ ظƒط§ظ† ظ…ط·ظ„ظˆط¨ط§ظ‹
                if (seasonalConfig?.requiresDeposit) {
                    depositAmount = seasonalConfig.depositAmount || pricePerUnit;
                }
                break;
        }

        const SERVICE_FEE_PERCENTAGE = 0.1; // 10%
        const serviceFee = basePrice * SERVICE_FEE_PERCENTAGE;
        const totalAmount = basePrice + serviceFee + depositAmount;

        return {
            basePrice,
            serviceFee,
            depositAmount,
            totalAmount,
            duration,
        };
    },

    /**
     * ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† طھظˆظپط± ط§ظ„ط¹ظ‚ط§ط± ظپظٹ ط§ظ„ظپطھط±ط© ط§ظ„ظ…ط·ظ„ظˆط¨ط©
     */
    async checkAvailability(
        propertyId: string,
        startDate: string,
        endDate: string
    ): Promise<{ available: boolean; error: any }> {
        const { validateUUID } = await import('@/utils/validation');

        const normalizedStart = normalizeDateOnly(startDate);
        const normalizedEnd = normalizeDateOnly(endDate);

        if (!normalizedStart || !normalizedEnd) {
            return { available: false, error: { message: 'صيغة التاريخ غير صالحة' } };
        }

        if (normalizedStart >= normalizedEnd) {
            return { available: false, error: { message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية' } };
        }

        if (shouldShortCircuitMock()) {
            return { available: true, error: null };
        }

        if (!validateUUID(propertyId)) {
            return { available: false, error: { message: 'معرف العقار غير صالح' } };
        }

        const { data, error } = await supabase
            .from('bookings')
            .select('id')
            .eq('property_id', propertyId)
            .in('status', ['confirmed', 'active'])
            .gt('end_date', normalizedStart)
            .lt('start_date', normalizedEnd)
            .limit(1);

        return {
            available: !data || data.length === 0,
            error,
        };
    },

    /**
     * إنشاء حجز جديد
     */
    async createBooking(bookingData: Omit<import('@/types').Booking, 'id' | 'createdAt'>): Promise<{
        data: import('@/types').Booking | null;
        error: any;
    }> {
        const { validateUUID } = await import('@/utils/validation');

        const normalizedStart = normalizeDateOnly(bookingData.startDate);
        const normalizedEnd = normalizeDateOnly(bookingData.endDate);

        if (!validateUUID(bookingData.userId)) {
            return { data: null, error: { message: 'معرف المستخدم غير صالح' } };
        }

        if (!normalizedStart || !normalizedEnd) {
            return { data: null, error: { message: 'صيغة التاريخ غير صالحة' } };
        }

        if (normalizedStart >= normalizedEnd) {
            return { data: null, error: { message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية' } };
        }

        const safeBookingData = {
            ...bookingData,
            startDate: normalizedStart,
            endDate: normalizedEnd,
        };

        if (shouldShortCircuitMock()) {
            const mockBooking: import('@/types').Booking = {
                ...safeBookingData,
                id: `BK-${Date.now()}`,
                paymentProof: undefined,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };
            return { data: mockBooking, error: null };
        }

        const { data: createdBookingId, error } = await supabase.rpc('create_atomic_booking', {
            p_property_id: safeBookingData.propertyId,
            p_user_id: safeBookingData.userId,
            p_start_date: safeBookingData.startDate,
            p_end_date: safeBookingData.endDate,
            p_tenant_name: safeBookingData.tenantName,
            p_tenant_phone: safeBookingData.tenantPhone,
            p_base_price: safeBookingData.basePrice,
            p_service_fee: safeBookingData.serviceFee,
            p_total_amount: safeBookingData.totalAmount,
            p_total_nights: safeBookingData.totalNights,
            p_total_months: safeBookingData.totalMonths,
            p_rental_type: safeBookingData.rentalType,
            p_tenant_email: safeBookingData.tenantEmail,
            p_deposit_amount: safeBookingData.depositAmount,
            p_payment_method: safeBookingData.paymentMethod,
        });

        if (error || !createdBookingId) {
            return { data: null, error };
        }

        const { data, error: bookingFetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', createdBookingId)
            .single();

        if (bookingFetchError) {
            return { data: null, error: bookingFetchError };
        }

        const booking: import('@/types').Booking = {
            id: data.id,
            propertyId: data.property_id,
            userId: data.user_id,
            startDate: data.start_date,
            endDate: data.end_date,
            totalNights: data.total_nights,
            totalMonths: data.total_months,
            rentalType: data.rental_type,
            tenantName: data.tenant_name,
            tenantPhone: data.tenant_phone,
            tenantEmail: data.tenant_email,
            basePrice: data.base_price,
            serviceFee: data.service_fee,
            depositAmount: data.deposit_amount,
            totalAmount: data.total_amount,
            paymentMethod: data.payment_method,
            paymentStatus: data.payment_status,
            paymentProof: (await resolveStorageValue(data.payment_proof, STORAGE_BUCKETS.paymentReceipts)) || undefined,
            status: data.status,
            createdAt: data.created_at,
            confirmedAt: data.confirmed_at,
        };

        try {
            const { data: propertyOwner, error: propertyOwnerError } = await supabase
                .from('properties')
                .select('owner_id')
                .eq('id', data.property_id)
                .maybeSingle();

            if (propertyOwnerError) {
                throw propertyOwnerError;
            }

            if (propertyOwner?.owner_id) {
                const conversationId = await this.createConversation({
                    propertyId: data.property_id,
                    buyerId: data.user_id,
                    ownerId: propertyOwner.owner_id,
                });

                const { data: existingMsg } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('conversation_id', conversationId)
                    .eq('message_type', 'system')
                    .filter('metadata->>type', 'eq', 'booking_request')
                    .filter('metadata->>booking_id', 'eq', data.id)
                    .maybeSingle();

                if (!existingMsg) {
                    await this.sendMessage({
                        conversationId,
                        senderId: data.user_id,
                        text: buildBookingSystemMessage(data.start_date, data.end_date),
                        messageType: 'system',
                        metadata: {
                            type: 'booking_request',
                            booking_id: data.id,
                            start_date: data.start_date,
                            end_date: data.end_date,
                            text: buildBookingSystemMessage(data.start_date, data.end_date),
                        },
                    });
                }
            }
        } catch (conversationError: any) {
            console.error('Error creating booking conversation:', {
                message: conversationError.message,
                code: conversationError.code,
                hint: conversationError.hint,
                details: conversationError.details,
            });
        }

        return { data: booking, error: null };
    },
    async getUserBookingsLegacy(userId: string, options?: RequestResilienceOptions): Promise<{ data: import('@/types').Booking[]; error: any; isTimeout?: boolean }> {
        if (shouldShortCircuitMock()) {
            return { data: [], error: null };
        }

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                property:properties(title, images, location, address)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            return { data: [], error };
        }

        // طھط­ظˆظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ
        const bookings: import('@/types').Booking[] = (data || []).map((item: any) => ({
            id: item.id,
            propertyId: item.property_id,
            userId: item.user_id,
            startDate: item.start_date,
            endDate: item.end_date,
            totalNights: item.total_nights,
            totalMonths: item.total_months,
            rentalType: item.rental_type,
            tenantName: item.tenant_name,
            tenantPhone: item.tenant_phone,
            tenantEmail: item.tenant_email,
            basePrice: item.base_price,
            serviceFee: item.service_fee,
            depositAmount: item.deposit_amount,
            totalAmount: item.total_amount,
            paymentMethod: item.payment_method,
            paymentStatus: item.payment_status,
            paymentProof: item.payment_proof,
            status: item.status,
            createdAt: item.created_at,
            confirmedAt: item.confirmed_at,
            property: item.property,
        }));

        return { data: bookings, error: null };
    },

    /**
     * ط¬ظ„ط¨ ط§ظ„ط­ط¬ظˆط²ط§طھ ط§ظ„ظˆط§ط±ط¯ط© ظˆط§ظ„طµط§ط¯ط±ط© (ظ„ظ„ظ…ط³طھط£ط¬ط± ظˆط§ظ„ظ…ط§ظ„ظƒ ظ…ط¹ط§ظ‹)
     */
    async getUserBookings(userId: string, options?: RequestResilienceOptions): Promise<{ bookings: any[]; error: any; isTimeout?: boolean }> {
        if (shouldShortCircuitMock()) {
            return { bookings: [], error: null, isTimeout: false };
        }

        try {
            return await fetchWithRetry(async () => {
                const { data, error } = await supabase
                    .rpc('get_user_bookings', { uid: userId });

                if (error) {
                    if (isMissingRpcFunctionError(error, 'get_user_bookings')) {
                        const fallback = await getUserBookingsFallback(userId);
                        return {
                            bookings: fallback.bookings,
                            error: fallback.error,
                            isTimeout: Boolean(fallback.isTimeout),
                        };
                    }

                    console.error('[getUserBookings RPC Error]', {
                        message: error.message,
                        code: error.code,
                        hint: error.hint,
                        details: error.details,
                    });
                    return { bookings: [], error, isTimeout: false };
                }

                const bookings = ((data || []) as UserBookingsRpcRow[]).map((row) => ({
                    id: row.booking_id,
                    propertyId: row.booking_property_id,
                    userId: row.booking_user_id,
                    startDate: row.start_date,
                    endDate: row.end_date,
                    totalAmount: row.total_amount,
                    status: row.status,
                    createdAt: row.created_at,
                    tenantName: row.tenant_name,
                    bookingType: row.booking_type,
                    property: {
                        id: row.prop_id,
                        title: row.prop_title,
                        images: row.prop_images || [],
                        area: row.prop_area,
                        ownerId: row.prop_owner_id,
                        ownerName: row.prop_owner_name,
                        ownerPhone: row.prop_owner_phone,
                    },
                    user: row.booking_type === 'owner'
                        ? {
                            id: row.profile_id,
                            fullName: row.profile_full_name,
                            avatarUrl: row.profile_avatar_url,
                        }
                        : null,
                }));

                return { bookings: await hydrateBookingsWithPropertyImages(bookings), error: null, isTimeout: false };
            }, {
                operationKey: 'getUserBookings',
                ...options,
            });
        } catch (error: any) {
            if (isMissingRpcFunctionError(error, 'get_user_bookings')) {
                const fallback = await getUserBookingsFallback(userId);
                return {
                    bookings: fallback.bookings,
                    error: fallback.error,
                    isTimeout: Boolean(fallback.isTimeout),
                };
            }

            if (isTimeoutLikeError(error)) {
                console.warn('[getUserBookings] Request timed out after retry budget.');
                return {
                    bookings: [],
                    error: { code: 'REQUEST_TIMEOUT', message: 'REQUEST_TIMEOUT' },
                    isTimeout: true,
                };
            }

            console.error('[getUserBookings Unexpected Error]', error);
            return { bookings: [], error, isTimeout: false };
        }
    },

    /**
     * ط±ظپط¹ ط¥ظٹطµط§ظ„ ط§ظ„ط¯ظپط¹
     */
    async uploadPaymentReceipt(
        bookingId: string,
        receiptFile: File
    ): Promise<{ url: string | null; error: any }> {
        if (shouldShortCircuitMock()) {
            return {
                url: 'https://example.com/receipt.jpg',
                error: null
            };
        }

        const userId = await getCurrentAuthUserId();
        const objectPath = buildStorageObjectPath(
            userId,
            bookingId,
            createRandomStorageName(receiptFile.name, 'jpg'),
        );

        const { error } = await supabase.storage
            .from(STORAGE_BUCKETS.paymentReceipts)
            .upload(objectPath, receiptFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) return { url: null, error };

        // طھط­ط¯ظٹط« ط§ظ„ط­ط¬ط² ط¨ط§ظ„ط¥ظٹطµط§ظ„
        const { error: attachError } = await supabase.rpc('attach_booking_payment_proof', {
            p_booking_id: bookingId,
            p_object_path: objectPath,
        });

        if (attachError) {
            return { url: null, error: attachError };
        }

        return {
            url: await resolveStorageValue(objectPath, STORAGE_BUCKETS.paymentReceipts),
            error: null,
        };
    },

    /**
     * ط¬ظ„ط¨ طھظپط§طµظٹظ„ ط­ط¬ط² ظ…ط­ط¯ط¯
     */
    async getBookingById(bookingId: string): Promise<{
        data: import('@/types').Booking | null;
        error: any;
    }> {
        if (shouldShortCircuitMock()) {
            return { data: null, error: null };
        }

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                property:properties(*),
                user:profiles(full_name, phone, email)
            `)
            .eq('id', bookingId)
            .single();

        if (error) {
            return { data: null, error };
        }

        const signedProperty = await hydratePropertyRow((data.property || null) as PropertyRow | null);

        const booking: import('@/types').Booking = {
            id: data.id,
            propertyId: data.property_id,
            userId: data.user_id,
            startDate: data.start_date,
            endDate: data.end_date,
            totalNights: data.total_nights,
            totalMonths: data.total_months,
            rentalType: data.rental_type,
            tenantName: data.tenant_name,
            tenantPhone: data.tenant_phone,
            tenantEmail: data.tenant_email,
            basePrice: data.base_price,
            serviceFee: data.service_fee,
            depositAmount: data.deposit_amount,
            totalAmount: data.total_amount,
            paymentMethod: data.payment_method,
            paymentStatus: data.payment_status,
            paymentProof: (await resolveStorageValue(data.payment_proof, STORAGE_BUCKETS.paymentReceipts)) || undefined,
            status: data.status,
            createdAt: data.created_at,
            confirmedAt: data.confirmed_at,
            property: signedProperty as any,
            user: data.user,
        };

        return { data: booking, error: null };
    },

    /**
     * طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ط­ط¬ط²
     */
    async cancelBooking(bookingId: string): Promise<{ error: any }> {
        if (shouldShortCircuitMock()) {
            return { error: null };
        }

        const { error } = await supabase.rpc('transition_booking_status', {
            p_booking_id: bookingId,
            p_action: 'tenant_cancel',
        });

        return { error };
    },

    async confirmBookingRequest(bookingId: string): Promise<{ error: any }> {
        if (shouldShortCircuitMock()) {
            return { error: null };
        }

        const { error } = await supabase.rpc('transition_booking_status', {
            p_booking_id: bookingId,
            p_action: 'landlord_confirm',
        });

        return { error };
    },

    async rejectBookingRequest(bookingId: string): Promise<{ error: any }> {
        if (shouldShortCircuitMock()) {
            return { error: null };
        }

        const { error } = await supabase.rpc('transition_booking_status', {
            p_booking_id: bookingId,
            p_action: 'landlord_reject',
        });

        return { error };
    },

    async moderatePropertyListing(
        propertyId: string,
        newStatus: 'available' | 'rejected',
    ): Promise<PropertyRow | null> {
        if (shouldShortCircuitMock()) {
            const idx = MOCK_PROPERTIES.findIndex((property) => property.id === propertyId);
            if (idx === -1) {
                return null;
            }

            MOCK_PROPERTIES[idx] = {
                ...MOCK_PROPERTIES[idx],
                status: newStatus,
            };

            return MOCK_PROPERTIES[idx];
        }

        const { error } = await supabase.rpc('moderate_property_listing', {
            p_property_id: propertyId,
            p_new_status: newStatus,
        });

        if (error) {
            console.error('Error moderating property listing:', error);
            return null;
        }

        return await this.getPropertyById(propertyId);
    }
};


