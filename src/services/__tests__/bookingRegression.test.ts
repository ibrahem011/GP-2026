import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom, mockRpc } = vi.hoisted(() => ({
    mockFrom: vi.fn(),
    mockRpc: vi.fn(),
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

import * as constants from '@/config/constants';
vi.mock('@/config/constants', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/config/constants')>();
    return {
        ...actual,
        getIsMockMode: vi.fn(() => actual.getIsMockMode()),
    };
});

import { supabaseService } from '../supabaseService';
import { supabase } from '@/lib/supabase';

function createAvailabilityQuery(result: { data: any; error: any }) {
    const chain: any = {};
    chain.select = vi.fn(() => chain);
    chain.insert = vi.fn(() => chain);
    chain.update = vi.fn(() => chain);
    chain.delete = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.neq = vi.fn(() => chain);
    chain.in = vi.fn(() => chain);
    chain.or = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.gt = vi.fn(() => chain);
    chain.lt = vi.fn(() => chain);
    chain.filter = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.single = vi.fn().mockResolvedValue(result);
    chain.maybeSingle = vi.fn().mockResolvedValue(result);
    chain.then = (resolve: any) => resolve(result);
    return chain;
}

function createSelectEqSingleQuery(result: { data: any; error: any }) {
    const chain: any = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.single = vi.fn().mockResolvedValue(result);
    return chain;
}

function createSelectEqMaybeSingleQuery(result: { data: any; error: any }) {
    const chain: any = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.maybeSingle = vi.fn().mockResolvedValue(result);
    return chain;
}

function createBookingInsertQuery(result: { data: any; error: any }) {
    const chain: any = {};
    chain.insert = vi.fn(() => chain);
    chain.select = vi.fn(() => chain);
    chain.single = vi.fn().mockResolvedValue(result);
    return chain;
}

function createMessageLookupQuery(result: { data: any; error: any }) {
    const chain: any = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.contains = vi.fn(() => chain);
    chain.limit = vi.fn().mockResolvedValue(result);
    return chain;
}

function createMessageInsertQuery(result: { error: any }, onInsert?: (payload: any) => void) {
    return {
        insert: vi.fn((payload: any) => {
            onInsert?.(payload);
            return Promise.resolve(result);
        }),
    };
}

function createConversationUpdateQuery(result: { error: any }, onUpdate?: (payload: any) => void) {
    const eq = vi.fn().mockResolvedValue(result);
    return {
        update: vi.fn((payload: any) => {
            onUpdate?.(payload);
            return { eq };
        }),
    };
}

const validUserId = '550e8400-e29b-41d4-a716-446655440000';
const validPropertyId = '550e8400-e29b-41d4-a716-446655440001';

const bookingPayload: Omit<import('@/types').Booking, 'id' | 'createdAt'> = {
    propertyId: validPropertyId,
    userId: validUserId,
    startDate: '2026-04-10',
    endDate: '2026-04-12',
    totalNights: 2,
    rentalType: 'daily',
    tenantName: 'Tenant',
    tenantPhone: '01000000000',
    tenantEmail: 'tenant@example.com',
    basePrice: 1000,
    serviceFee: 100,
    depositAmount: 0,
    totalAmount: 1100,
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'pending',
    paymentProof: '',
    status: 'pending',
};

const bookingRow = {
    id: 'booking-1',
    property_id: validPropertyId,
    user_id: validUserId,
    start_date: '2026-04-10',
    end_date: '2026-04-12',
    total_nights: 2,
    total_months: null,
    rental_type: 'daily',
    tenant_name: 'Tenant',
    tenant_phone: '01000000000',
    tenant_email: 'tenant@example.com',
    base_price: 1000,
    service_fee: 100,
    deposit_amount: 0,
    total_amount: 1100,
    payment_method: 'cash_on_delivery',
    payment_status: 'pending',
    payment_proof: '',
    status: 'pending',
    created_at: '2026-04-01T10:00:00Z',
    confirmed_at: null,
};

import { setTestMockOverride } from '@/config/constants';

describe('Booking regressions', () => {
    beforeEach(() => {
        vi.mocked(constants.getIsMockMode).mockReturnValue(false);
        constants.setTestMockOverride(false);
        vi.clearAllMocks();
    });

    afterEach(() => {
        setTestMockOverride(null);
    });

    describe('availability logic', () => {
        it('blocks overlaps using confirmed + active statuses only (half-open query)', async () => {
            const availabilityQuery = createAvailabilityQuery({
                data: [{ id: 'active-booking' }],
                error: null,
            });

            mockFrom.mockReturnValueOnce(availabilityQuery);

            const result = await supabaseService.checkAvailability(
                validPropertyId,
                '2026-05-10',
                '2026-05-12',
            );

            expect(result.available).toBe(false);
            expect(availabilityQuery.in).toHaveBeenCalledWith('status', ['confirmed', 'active']);
            expect(availabilityQuery.gt).toHaveBeenCalledWith('end_date', '2026-05-10');
            expect(availabilityQuery.lt).toHaveBeenCalledWith('start_date', '2026-05-12');
        });

        it('blocks overlaps when an existing confirmed booking is found', async () => {
            const availabilityQuery = createAvailabilityQuery({
                data: [{ id: 'confirmed-booking' }],
                error: null,
            });

            mockFrom.mockReturnValueOnce(availabilityQuery);

            const result = await supabaseService.checkAvailability(
                validPropertyId,
                '2026-07-10',
                '2026-07-15',
            );

            expect(result.available).toBe(false);
        });

        it('allows edge-touching ranges (end = next start) and excludes pending/requested from blockers', async () => {
            const availabilityQuery = createAvailabilityQuery({
                data: [],
                error: null,
            });

            mockFrom.mockReturnValueOnce(availabilityQuery);

            const result = await supabaseService.checkAvailability(
                validPropertyId,
                '2026-06-01',
                '2026-06-05',
            );

            expect(result.available).toBe(true);
            expect(availabilityQuery.in).toHaveBeenCalledWith('status', ['confirmed', 'active']);
        });
    });

    describe('read purity', () => {
        it('getBookingById performs a pure read without conversation/message writes', async () => {
            const bookingSelect = createSelectEqSingleQuery({
                data: {
                    ...bookingRow,
                    property: { id: validPropertyId, title: 'Property' },
                    user: { full_name: 'Tenant', phone: '01000000000', email: 'tenant@example.com' },
                },
                error: null,
            });

            mockFrom.mockImplementation((table: string) => {
                if (table === 'bookings') return bookingSelect;
                throw new Error(`Unexpected table access in pure read: ${table}`);
            });

            const { data, error } = await supabaseService.getBookingById('booking-1');

            expect(error).toBeNull();
            expect(data?.id).toBe('booking-1');
            expect(mockFrom).toHaveBeenCalledTimes(1);
            expect(mockFrom).toHaveBeenCalledWith('bookings');
        });
    });

    describe('createBooking messaging', () => {
        const bookingData = {
            propertyId: validPropertyId,
            userId: validUserId,
            startDate: '2025-01-01',
            endDate: '2025-01-02',
            totalNights: 1,
            totalMonths: 0,
            rentalType: 'daily' as const,
            tenantName: 'Tenant',
            tenantPhone: '01000000000',
            tenantEmail: 'tenant@example.com',
            basePrice: 100,
            serviceFee: 10,
            depositAmount: 50,
            totalAmount: 160,
            paymentMethod: 'vodafone_cash' as const,
            paymentStatus: 'pending' as const,
            status: 'pending' as const,
        };

        const bookingRow = { 
            id: 'booking-1', 
            ...bookingData, 
            property_id: validPropertyId, 
            user_id: validUserId, 
            start_date: bookingData.startDate,
            end_date: bookingData.endDate,
            created_at: new Date().toISOString() 
        };

        it('sends exactly one booking_request message for a successful booking', async () => {
            const sendMessageSpy = vi.spyOn(supabaseService, 'sendMessage').mockResolvedValue(undefined as any);

            mockFrom.mockImplementation((table: string) => {
                if (table === 'bookings') return createAvailabilityQuery({ data: bookingRow, error: null });
                if (table === 'properties') return createAvailabilityQuery({ data: { owner_id: 'owner-1' }, error: null });
                if (table === 'conversations') return createAvailabilityQuery({ data: { id: 'conv-1' }, error: null });
                if (table === 'messages') {
                    // This mock covers both the lookup and the possible insert (though insert is handled via sendMessage)
                    return createAvailabilityQuery({ data: null, error: null });
                }
                return createAvailabilityQuery({ data: null, error: null });
            });

            await supabaseService.createBooking(bookingData);

            expect(sendMessageSpy).toHaveBeenCalledTimes(1);
            sendMessageSpy.mockRestore();
        });

        it('does not duplicate booking_request message on retry for the same booking_id', async () => {
            const sendMessageSpy = vi.spyOn(supabaseService, 'sendMessage').mockResolvedValue(undefined as any);

            mockFrom.mockImplementation((table: string) => {
                if (table === 'bookings') return createAvailabilityQuery({ data: bookingRow, error: null });
                if (table === 'properties') return createAvailabilityQuery({ data: { owner_id: 'owner-1' }, error: null });
                if (table === 'conversations') return createAvailabilityQuery({ data: { id: 'conv-1' }, error: null });
                if (table === 'messages') {
                    // Return an existing message to trigger the skip
                    return createAvailabilityQuery({ data: { id: 'msg-existing' }, error: null });
                }
                return createAvailabilityQuery({ data: null, error: null });
            });

            await supabaseService.createBooking(bookingData);

            expect(sendMessageSpy).not.toHaveBeenCalled();
            sendMessageSpy.mockRestore();
        });
    });

    describe('mock mode isolation', () => {
        it('short-circuits createPaymentRequest and unlockProperty in runtime mock mode', async () => {
            constants.setTestMockOverride(true);
            const spy = vi.spyOn(supabase, 'from');

            await supabaseService.createPaymentRequest({
                userId: validUserId,
                propertyId: validPropertyId,
                amount: 50,
                paymentMethod: 'vodafone_cash',
            });

            await supabaseService.unlockProperty(validUserId, validPropertyId);

            expect(spy).not.toHaveBeenCalled();
            constants.setTestMockOverride(false);
            spy.mockRestore();
        });
    });
});
