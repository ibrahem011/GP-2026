import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AREAS } from '@/types';

const {
    mockFrom,
    mockGetSession,
    mockRefreshSession,
    mockUploadImage,
    mockDeleteImage,
    mockSignPathsWithServiceRole,
} = vi.hoisted(() => ({
    mockFrom: vi.fn(),
    mockGetSession: vi.fn(),
    mockRefreshSession: vi.fn(),
    mockUploadImage: vi.fn(),
    mockDeleteImage: vi.fn(),
    mockSignPathsWithServiceRole: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: mockFrom,
        auth: {
            getSession: mockGetSession,
            refreshSession: mockRefreshSession,
            getUser: vi.fn(),
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
    uploadImage: (...args: any[]) => mockUploadImage(...args),
    deleteImage: (...args: any[]) => mockDeleteImage(...args),
}));

vi.mock('@/lib/serverSupabase', () => ({
    signPathsWithServiceRole: (...args: any[]) => mockSignPathsWithServiceRole(...args),
}));

import { supabaseService } from '../supabaseService';

function createInsertChain(result: { data: any; error: any }) {
    const single = vi.fn().mockResolvedValue(result);
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));

    return { insert, select, single };
}

function makeInsertedRow(overrides: Record<string, unknown> = {}) {
    return {
        id: 'property-1',
        owner_id: 'owner-1',
        title: 'شقة',
        description: 'وصف',
        price: 2500,
        price_unit: 'day',
        category: 'apartment',
        status: 'pending',
        location_lat: null,
        location_lng: null,
        address: 'شارع البحر',
        area: AREAS[0],
        bedrooms: 2,
        bathrooms: 1,
        floor_area: null,
        floor_number: 3,
        features: ['wifi'],
        images: [],
        owner_phone: '01012345678',
        owner_name: 'مالك',
        is_verified: false,
        views_count: 0,
        created_at: '2026-04-15T00:00:00Z',
        updated_at: '2026-04-15T00:00:00Z',
        ...overrides,
    };
}

function makeValidPropertyInsert() {
    return {
        title: '  شقة  ',
        description: ' وصف ',
        price: 2500,
        price_unit: 'day' as const,
        category: 'apartment' as const,
        location_lat: null,
        location_lng: null,
        address: ' شارع البحر ',
        area: AREAS[0],
        bedrooms: 2,
        bathrooms: 1,
        floor_area: null,
        floor_number: 3,
        features: ['wifi'],
        owner_phone: '+20 1012345678',
        owner_name: ' مالك ',
    };
}

describe('supabaseService.createFullProperty', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUploadImage.mockResolvedValue('owner-1/property.png');
        mockDeleteImage.mockResolvedValue(undefined);
        mockSignPathsWithServiceRole.mockResolvedValue(new Map());
        mockRefreshSession.mockResolvedValue({
            data: { session: { user: { id: 'owner-1' } } },
            error: null,
        });
    });

    it('normalizes payload data and reports stage changes before inserting', async () => {
        const insertChain = createInsertChain({
            data: makeInsertedRow({ images: ['owner-1/property.png'] }),
            error: null,
        });
        const stages: string[] = [];

        mockGetSession.mockResolvedValue({
            data: { session: { user: { id: 'owner-1' } } },
            error: null,
        });
        mockFrom.mockImplementation((table: string) => {
            expect(table).toBe('properties');
            return {
                insert: insertChain.insert,
            };
        });

        await supabaseService.createFullProperty(
            makeValidPropertyInsert(),
            [new File(['image'], 'property.png', { type: 'image/png' })],
            'owner-1',
            {
                onStageChange: (stage) => stages.push(stage),
            },
        );

        expect(insertChain.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'شقة',
                description: 'وصف',
                owner_phone: '01012345678',
                owner_name: 'مالك',
                owner_id: 'owner-1',
                images: ['owner-1/property.png'],
                status: 'pending',
            }),
        );
        expect(stages).toEqual(['preparing', 'uploading', 'saving']);
    });

    it('rejects invalid data before checking the session', async () => {
        await expect(
            supabaseService.createFullProperty(
                {
                    title: 'شقة',
                    description: 'وصف',
                    price: 2500,
                    price_unit: 'day',
                    category: 'apartment',
                    address: 'عنوان',
                    area: AREAS[0],
                    bedrooms: 21,
                    bathrooms: 1,
                    floor_area: null,
                    floor_number: 3,
                    owner_phone: '01012345678',
                    owner_name: 'مالك',
                },
                [],
                'owner-1',
            ),
        ).rejects.toThrow('بيانات العقار غير صالحة للنشر.');

        expect(mockGetSession).not.toHaveBeenCalled();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('refreshes the session once when the initial session is missing', async () => {
        const insertChain = createInsertChain({
            data: makeInsertedRow(),
            error: null,
        });

        mockGetSession.mockResolvedValue({
            data: { session: null },
            error: null,
        });
        mockFrom.mockImplementation(() => ({
            insert: insertChain.insert,
        }));

        await expect(
            supabaseService.createFullProperty(makeValidPropertyInsert(), [], 'owner-1'),
        ).resolves.toMatchObject({ id: 'property-1' });

        expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    });

    it('throws a classified session error when refresh cannot recover the session', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: null },
            error: null,
        });
        mockRefreshSession.mockResolvedValue({
            data: { session: null },
            error: null,
        });

        await expect(
            supabaseService.createFullProperty(makeValidPropertyInsert(), [], 'owner-1'),
        ).rejects.toMatchObject({
            code: 'SESSION_EXPIRED',
        });

        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('classifies upload failures with UPLOAD_FAILED', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: { user: { id: 'owner-1' } } },
            error: null,
        });
        mockUploadImage.mockRejectedValue(new Error('رفع الصورة فشل'));

        await expect(
            supabaseService.createFullProperty(
                makeValidPropertyInsert(),
                [new File(['image'], 'property.png', { type: 'image/png' })],
                'owner-1',
            ),
        ).rejects.toMatchObject({
            code: 'UPLOAD_FAILED',
        });

        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('classifies timed out saves with REQUEST_TIMEOUT', async () => {
        const single = vi.fn(() => new Promise(() => {}));
        const select = vi.fn(() => ({ single }));
        const insert = vi.fn(() => ({ select }));

        mockGetSession.mockResolvedValue({
            data: { session: { user: { id: 'owner-1' } } },
            error: null,
        });
        mockFrom.mockImplementation(() => ({
            insert,
        }));

        await expect(
            supabaseService.createFullProperty(makeValidPropertyInsert(), [], 'owner-1', {
                timeoutMs: 1,
                maxRetries: 0,
            }),
        ).rejects.toMatchObject({
            code: 'REQUEST_TIMEOUT',
        });
    });
});
