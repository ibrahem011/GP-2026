import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRpc, mockFrom } = vi.hoisted(() => ({
    mockRpc: vi.fn(),
    mockFrom: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        rpc: mockRpc,
        from: mockFrom,
        auth: {
            getUser: vi.fn(),
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signInWithOAuth: vi.fn(),
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
                createSignedUrl: vi.fn((path: string) => ({ data: { signedUrl: `https://example.com/${path}` }, error: null })),
                createSignedUrls: vi.fn((paths: string[]) => ({
                    data: paths.map((path) => ({ path, signedUrl: `https://example.com/${path}` })),
                    error: null,
                })),
                remove: vi.fn(),
            })),
        },
    },
    STORAGE_BUCKET: 'properties-images',
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
}));

import {
    fetchWithRetry,
    resetRequestResilienceStateForTests,
    supabaseService,
} from '../supabaseService';

function createTimeoutError() {
    const error = new Error('REQUEST_TIMEOUT') as Error & { code?: string };
    error.name = 'TimeoutError';
    error.code = 'REQUEST_TIMEOUT';
    return error;
}

function createEqOrderQuery(result: { data: any; error: any }) {
    const order = vi.fn().mockResolvedValue(result);
    const eq = vi.fn(() => ({ order }));
    return {
        select: vi.fn(() => ({ eq })),
    };
}

function createInQuery(result: { data: any; error: any }) {
    const inFilter = vi.fn().mockResolvedValue(result);
    return {
        select: vi.fn(() => ({ in: inFilter })),
    };
}

function createPropertiesQuery(result: { data: any; error: any }) {
    const builder: any = {
        eq: vi.fn(() => builder),
        gte: vi.fn(() => builder),
        lte: vi.fn(() => builder),
        contains: vi.fn(() => builder),
        or: vi.fn(() => builder),
        range: vi.fn(() => builder),
        order: vi.fn(() => builder),
        abortSignal: vi.fn(() => builder),
        then: (onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) =>
            Promise.resolve(result).then(onFulfilled, onRejected),
    };

    return {
        select: vi.fn(() => builder),
        builder,
    };
}

function createMaybeSingleQuery(result: { data: any; error: any }) {
    const maybeSingle = vi.fn().mockResolvedValue(result);
    const eq = vi.fn(() => ({ maybeSingle }));
    return {
        select: vi.fn(() => ({ eq })),
        eq,
        maybeSingle,
    };
}

function createCountQuery(result: { count: number | null; error: any }) {
    const eq = vi.fn().mockResolvedValue(result);
    return {
        select: vi.fn(() => ({ eq })),
        eq,
    };
}

function createRejectingCountQuery(error: unknown) {
    const eq = vi.fn().mockRejectedValue(error);
    return {
        select: vi.fn(() => ({ eq })),
        eq,
    };
}

describe('supabaseService RPC methods', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    beforeEach(() => {
        mockRpc.mockReset();
        mockFrom.mockReset();
        resetRequestResilienceStateForTests();
        window.localStorage.removeItem('DEV_MOCK_MODE');
    });

    describe('getUserBookings', () => {
        it('maps RPC rows into booking objects', async () => {
            mockRpc.mockResolvedValueOnce({
                data: [
                    {
                        booking_id: 'b1',
                        booking_property_id: 'p1',
                        booking_user_id: 'user-123',
                        start_date: '2026-03-10',
                        end_date: '2026-03-12',
                        total_amount: 1200,
                        status: 'requested',
                        created_at: '2026-03-01T10:00:00Z',
                        tenant_name: 'Tenant One',
                        booking_type: 'tenant',
                        prop_id: 'p1',
                        prop_title: 'Prop 1',
                        prop_images: ['img1.jpg'],
                        prop_area: 'Area 1',
                        prop_owner_id: 'owner1',
                        prop_owner_name: 'Owner One',
                        prop_owner_phone: '01000000000',
                        profile_id: null,
                        profile_full_name: null,
                        profile_avatar_url: null,
                    },
                    {
                        booking_id: 'b2',
                        booking_property_id: 'p2',
                        booking_user_id: 'tenant-2',
                        start_date: '2026-03-15',
                        end_date: '2026-03-18',
                        total_amount: 2400,
                        status: 'confirmed',
                        created_at: '2026-03-02T10:00:00Z',
                        tenant_name: 'Tenant Two',
                        booking_type: 'owner',
                        prop_id: 'p2',
                        prop_title: 'Prop 2',
                        prop_images: ['img2.jpg'],
                        prop_area: 'Area 2',
                        prop_owner_id: 'owner-123',
                        prop_owner_name: 'Owner Two',
                        prop_owner_phone: '01111111111',
                        profile_id: 'tenant-2',
                        profile_full_name: 'John Doe',
                        profile_avatar_url: 'avatar.jpg',
                    },
                ],
                error: null,
            });

            const { bookings, error, isTimeout } = await supabaseService.getUserBookings('user-123');

            expect(mockRpc).toHaveBeenCalledWith('get_user_bookings', { uid: 'user-123' });
            expect(error).toBeNull();
            expect(isTimeout).toBe(false);
            expect(bookings).toHaveLength(2);
            expect(bookings[0].id).toBe('b1');
            expect(bookings[0].property.title).toBe('Prop 1');
            expect(bookings[1].bookingType).toBe('owner');
            expect(bookings[1].user.fullName).toBe('John Doe');
        });

        it('returns an error object when the RPC fails', async () => {
            mockRpc.mockResolvedValue({
                data: null,
                error: { message: 'Unauthorized access' },
            });

            const { bookings, error, isTimeout } = await supabaseService.getUserBookings('user-123');

            expect(bookings).toEqual([]);
            expect(error).toBeDefined();
            expect(error.message).toBe('Unauthorized access');
            expect(isTimeout).toBe(false);
            expect(mockRpc).toHaveBeenCalledTimes(1);
        });

        it('returns a timeout result when the RPC times out', async () => {
            mockRpc.mockRejectedValue(createTimeoutError());

            const { bookings, error, isTimeout } = await supabaseService.getUserBookings('user-123', {
                timeoutMs: 10,
                maxRetries: 0,
            });

            expect(bookings).toEqual([]);
            expect(error).toEqual({ code: 'REQUEST_TIMEOUT', message: 'REQUEST_TIMEOUT' });
            expect(isTimeout).toBe(true);
            expect(mockRpc).toHaveBeenCalledTimes(1);
        });

        it('falls back to direct queries when the RPC function is missing', async () => {
            mockRpc.mockResolvedValueOnce({
                data: null,
                error: {
                    code: 'PGRST202',
                    message: 'Could not find the function public.get_user_bookings(uid) in the schema cache',
                },
            });

            mockFrom
                .mockImplementationOnce((table: string) => {
                    expect(table).toBe('bookings');
                    return createEqOrderQuery({
                        data: [
                            {
                                id: 'tenant-booking',
                                property_id: 'p1',
                                user_id: 'user-123',
                                start_date: '2026-03-10',
                                end_date: '2026-03-12',
                                total_amount: 1200,
                                status: 'requested',
                                created_at: '2026-03-01T10:00:00Z',
                                tenant_name: 'Tenant One',
                                property: {
                                    id: 'p1',
                                    title: 'Prop 1',
                                    images: ['img1.jpg'],
                                    area: 'Area 1',
                                    owner_id: 'owner-1',
                                    owner_name: 'Owner One',
                                    owner_phone: '01000000000',
                                },
                            },
                        ],
                        error: null,
                    });
                })
                .mockImplementationOnce((table: string) => {
                    expect(table).toBe('bookings');
                    return createEqOrderQuery({
                        data: [
                            {
                                id: 'owner-booking',
                                property_id: 'p2',
                                user_id: 'tenant-2',
                                start_date: '2026-03-15',
                                end_date: '2026-03-18',
                                total_amount: 2400,
                                status: 'confirmed',
                                created_at: '2026-03-02T10:00:00Z',
                                tenant_name: 'Tenant Two',
                                property: {
                                    id: 'p2',
                                    title: 'Prop 2',
                                    images: ['img2.jpg'],
                                    area: 'Area 2',
                                    owner_id: 'user-123',
                                    owner_name: 'Owner Two',
                                    owner_phone: '01111111111',
                                },
                                user: {
                                    id: 'tenant-2',
                                    full_name: 'John Doe',
                                    avatar_url: 'avatar.jpg',
                                },
                            },
                        ],
                        error: null,
                    });
                });

            const { bookings, error } = await supabaseService.getUserBookings('user-123');

            expect(error).toBeNull();
            expect(bookings).toHaveLength(2);
            expect(bookings[0].bookingType).toBe('owner');
            expect(bookings[0].user.fullName).toBe('John Doe');
            expect(bookings[1].bookingType).toBe('tenant');
            expect(bookings[1].property.title).toBe('Prop 1');
        });
    });

    describe('respondToBookingRequest', () => {
        it('passes the trimmed landlord note to the booking transition RPC', async () => {
            mockRpc.mockResolvedValueOnce({ data: 'confirmed', error: null });

            const { error } = await supabaseService.respondToBookingRequest(
                'booking-1',
                'landlord_confirm',
                '  تم القبول، يرجى التواصل قبل الوصول.  ',
            );

            expect(error).toBeNull();
            expect(mockRpc).toHaveBeenCalledWith('transition_booking_status', {
                p_booking_id: 'booking-1',
                p_action: 'landlord_confirm',
                p_landlord_note: 'تم القبول، يرجى التواصل قبل الوصول.',
            });
        });
    });

    describe('getFavorites', () => {
        it('returns data and no error on success', async () => {
            mockRpc.mockResolvedValueOnce({
                data: [
                    { id: 'p1', title: 'Property 1', images: ['img1.jpg'] },
                    { id: 'p2', title: 'Property 2', images: ['img2.jpg'] },
                ],
                error: null,
            });

            const { data, error } = await supabaseService.getFavorites('user-123');

            expect(mockRpc).toHaveBeenCalledWith('get_user_favorites', { uid: 'user-123' });
            expect(error).toBeNull();
            expect(data).toHaveLength(2);
            expect(data[0]).toHaveProperty('title');
            expect(data[0]).toHaveProperty('images');
        });

        it('returns an error object when the RPC rejects', async () => {
            mockRpc.mockRejectedValue(new Error('Database error'));

            const { data, error, isTimeout } = await supabaseService.getFavorites('user-123');

            expect(data).toEqual([]);
            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(Error);
            expect(isTimeout).toBe(false);
            expect(mockRpc).toHaveBeenCalledTimes(1);
        });

        it('returns a timeout result when the RPC times out', async () => {
            mockRpc.mockRejectedValue(createTimeoutError());

            const { data, error, isTimeout } = await supabaseService.getFavorites('user-123', {
                timeoutMs: 10,
                maxRetries: 0,
            });

            expect(data).toEqual([]);
            expect(error).toEqual({ code: 'REQUEST_TIMEOUT', message: 'REQUEST_TIMEOUT' });
            expect(isTimeout).toBe(true);
            expect(mockRpc).toHaveBeenCalledTimes(1);
        });

        it('falls back to direct queries when the RPC function is missing', async () => {
            mockRpc.mockResolvedValueOnce({
                data: null,
                error: {
                    code: 'PGRST202',
                    message: 'Could not find the function public.get_user_favorites(uid) in the schema cache',
                },
            });

            mockFrom
                .mockImplementationOnce((table: string) => {
                    expect(table).toBe('favorites');
                    return createEqOrderQuery({
                        data: [
                            { property_id: 'p2', created_at: '2026-03-02T10:00:00Z' },
                            { property_id: 'p1', created_at: '2026-03-01T10:00:00Z' },
                        ],
                        error: null,
                    });
                })
                .mockImplementationOnce((table: string) => {
                    expect(table).toBe('properties');
                    return createInQuery({
                        data: [
                            { id: 'p1', title: 'Property 1', images: ['img1.jpg'] },
                            { id: 'p2', title: 'Property 2', images: ['img2.jpg'] },
                        ],
                        error: null,
                    });
                });

            const { data, error } = await supabaseService.getFavorites('user-123');

            expect(error).toBeNull();
            expect(data.map((item) => item.id)).toEqual(['p2', 'p1']);
            expect(data[0].title).toBe('Property 2');
        });
    });

    describe('getProfileStats', () => {
        it('returns count-only profile stats', async () => {
            const propertiesQuery = createCountQuery({ count: 7, error: null });
            const unlockedQuery = createCountQuery({ count: 3, error: null });
            const favoritesQuery = createCountQuery({ count: 2, error: null });

            mockFrom.mockImplementation((table: string) => {
                if (table === 'properties') return propertiesQuery;
                if (table === 'unlocked_properties') return unlockedQuery;
                if (table === 'favorites') return favoritesQuery;
                throw new Error(`Unexpected table ${table}`);
            });

            const { stats, error, isTimeout } = await supabaseService.getProfileStats('user-123', {
                timeoutMs: 8_000,
                maxRetries: 0,
                operationKey: 'profileStats-test',
            });

            expect(error).toBeNull();
            expect(isTimeout).toBe(false);
            expect(stats).toEqual({ properties: 7, unlocked: 3, favorites: 2 });
            expect(propertiesQuery.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
            expect(propertiesQuery.eq).toHaveBeenCalledWith('owner_id', 'user-123');
            expect(unlockedQuery.select).toHaveBeenCalledWith('property_id', { count: 'exact', head: true });
            expect(unlockedQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
            expect(favoritesQuery.select).toHaveBeenCalledWith('property_id', { count: 'exact', head: true });
            expect(favoritesQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
        });

        it('returns a timeout result when profile stats time out', async () => {
            mockFrom.mockReturnValue(createRejectingCountQuery(createTimeoutError()));

            const { stats, error, isTimeout } = await supabaseService.getProfileStats('user-123', {
                timeoutMs: 10,
                maxRetries: 0,
                operationKey: 'profileStats-timeout-test',
            });

            expect(stats).toEqual({ properties: 0, unlocked: 0, favorites: 0 });
            expect(error).toEqual({ code: 'REQUEST_TIMEOUT', message: 'REQUEST_TIMEOUT' });
            expect(isTimeout).toBe(true);
        });

        it('returns an error without hanging when one profile stats count fails', async () => {
            const propertiesQuery = createCountQuery({ count: 7, error: null });
            const unlockedQuery = createCountQuery({ count: 3, error: null });
            const favoritesQuery = createCountQuery({ count: null, error: { message: 'favorites failed' } });

            mockFrom.mockImplementation((table: string) => {
                if (table === 'properties') return propertiesQuery;
                if (table === 'unlocked_properties') return unlockedQuery;
                if (table === 'favorites') return favoritesQuery;
                throw new Error(`Unexpected table ${table}`);
            });

            const { stats, error, isTimeout } = await supabaseService.getProfileStats('user-123', {
                timeoutMs: 8_000,
                maxRetries: 0,
                operationKey: 'profileStats-error-test',
            });

            expect(stats).toEqual({ properties: 0, unlocked: 0, favorites: 0 });
            expect(error).toEqual({ message: 'favorites failed' });
            expect(isTimeout).toBe(false);
        });
    });

    describe('fetchWithRetry', () => {
        it('does not retry timeout errors unless retryOnTimeout is enabled', async () => {
            const fn = vi.fn().mockRejectedValue(createTimeoutError());

            await expect(fetchWithRetry(fn, {
                timeoutMs: 10,
                maxRetries: 2,
                operationKey: 'no-retry-by-default-test',
            })).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('retries timeout errors when retryOnTimeout is enabled', async () => {
            vi.useFakeTimers();
            const fn = vi.fn()
                .mockRejectedValueOnce(createTimeoutError())
                .mockResolvedValueOnce('ok');

            const promise = fetchWithRetry(fn, {
                timeoutMs: 10,
                maxRetries: 1,
                retryOnTimeout: true,
                operationKey: 'retry-enabled-test',
            });

            await vi.advanceTimersByTimeAsync(1_000);

            await expect(promise).resolves.toBe('ok');
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('skips retry when the operation circuit is open', async () => {
            const operationKey = 'circuit-open-test';

            for (let i = 0; i < 3; i += 1) {
                await expect(fetchWithRetry(
                    vi.fn().mockRejectedValue(createTimeoutError()),
                    { timeoutMs: 10, maxRetries: 0, operationKey },
                )).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
            }

            const fn = vi.fn()
                .mockRejectedValueOnce(createTimeoutError())
                .mockResolvedValueOnce('ok');

            await expect(fetchWithRetry(fn, {
                timeoutMs: 10,
                maxRetries: 1,
                retryOnTimeout: true,
                operationKey,
            })).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });

            expect(fn).toHaveBeenCalledTimes(1);
        });
    });

    describe('getProperties collections', () => {
        it('normalizes legacy local property image paths when fetching collections', async () => {
            const propertiesQuery = createPropertiesQuery({
                data: [
                    {
                        id: 'p1',
                        title: 'Legacy local image',
                        images: ['/images/property1.jpg', '/images/property5.jpg'],
                        is_verified: true,
                        views_count: 250,
                        created_at: '2026-04-01T10:00:00Z',
                    },
                ],
                error: null,
            });

            mockFrom.mockImplementationOnce((table: string) => {
                expect(table).toBe('properties');
                return propertiesQuery;
            });

            const rows = await supabaseService.getProperties({ collection: 'featured' });

            expect(rows[0].images).toEqual([
                '/images/property1.png',
                '/images/property-placeholder.svg',
            ]);
        });

        it('applies featured collection filtering and sorting on the query', async () => {
            const propertiesQuery = createPropertiesQuery({
                data: [
                    {
                        id: 'p1',
                        title: 'Featured property',
                        images: [],
                        is_verified: true,
                        views_count: 250,
                        created_at: '2026-04-01T10:00:00Z',
                    },
                ],
                error: null,
            });

            mockFrom.mockImplementationOnce((table: string) => {
                expect(table).toBe('properties');
                return propertiesQuery;
            });

            const rows = await supabaseService.getProperties({
                status: 'available',
                collection: 'featured',
            });

            expect(propertiesQuery.select).toHaveBeenCalledWith('*');
            expect(propertiesQuery.builder.eq).toHaveBeenCalledWith('status', 'available');
            expect(propertiesQuery.builder.eq).toHaveBeenCalledWith('is_verified', true);
            expect(propertiesQuery.builder.order).toHaveBeenNthCalledWith(1, 'views_count', {
                ascending: false,
            });
            expect(propertiesQuery.builder.order).toHaveBeenNthCalledWith(2, 'created_at', {
                ascending: false,
            });
            expect(rows[0].id).toBe('p1');
        });

        it('applies recent collection sorting by creation date', async () => {
            const propertiesQuery = createPropertiesQuery({
                data: [
                    {
                        id: 'p2',
                        title: 'Recent property',
                        images: [],
                        is_verified: false,
                        views_count: 10,
                        created_at: '2026-04-02T10:00:00Z',
                    },
                ],
                error: null,
            });

            mockFrom.mockImplementationOnce((table: string) => {
                expect(table).toBe('properties');
                return propertiesQuery;
            });

            const rows = await supabaseService.getProperties({
                collection: 'recent',
            });

            expect(propertiesQuery.select).toHaveBeenCalledWith('*');
            expect(propertiesQuery.builder.eq).not.toHaveBeenCalledWith('is_verified', true);
            expect(propertiesQuery.builder.order).toHaveBeenCalledTimes(1);
            expect(propertiesQuery.builder.order).toHaveBeenCalledWith('created_at', {
                ascending: false,
            });
            expect(rows[0].id).toBe('p2');
        });
    });

    describe('getPropertyById', () => {
        it('normalizes legacy local image paths for a single property fetch', async () => {
            const propertyQuery = createMaybeSingleQuery({
                data: {
                    id: 'property-1',
                    title: 'Details property',
                    images: ['/images/property4.jpg', '/images/property5.jpg'],
                },
                error: null,
            });

            mockFrom.mockImplementationOnce((table: string) => {
                expect(table).toBe('properties');
                return propertyQuery;
            });

            const property = await supabaseService.getPropertyById('property-1');

            expect(propertyQuery.select).toHaveBeenCalledWith('*');
            expect(propertyQuery.eq).toHaveBeenCalledWith('id', 'property-1');
            expect(property?.images).toEqual([
                '/images/property4.png',
                '/images/property-placeholder.svg',
            ]);
        });
    });
});
