import { beforeEach, describe, expect, it, vi } from 'vitest';

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
                remove: vi.fn(),
            })),
        },
    },
    STORAGE_BUCKET: 'properties-images',
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
}));

import { supabaseService } from '../supabaseService';

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

describe('supabaseService RPC methods', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

            const { bookings, error } = await supabaseService.getUserBookings('user-123');

            expect(mockRpc).toHaveBeenCalledWith('get_user_bookings', { uid: 'user-123' });
            expect(error).toBeNull();
            expect(bookings).toHaveLength(2);
            expect(bookings[0].id).toBe('b1');
            expect(bookings[0].property.title).toBe('Prop 1');
            expect(bookings[1].bookingType).toBe('owner');
            expect(bookings[1].user.fullName).toBe('John Doe');
        });

        it('returns an error object when the RPC fails', async () => {
            mockRpc.mockResolvedValueOnce({
                data: null,
                error: { message: 'Unauthorized access' },
            });

            const { bookings, error } = await supabaseService.getUserBookings('user-123');

            expect(bookings).toEqual([]);
            expect(error).toBeDefined();
            expect(error.message).toBe('Unauthorized access');
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
            mockRpc.mockRejectedValueOnce(new Error('Database error'));

            const { data, error } = await supabaseService.getFavorites('user-123');

            expect(data).toEqual([]);
            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(Error);
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
});
