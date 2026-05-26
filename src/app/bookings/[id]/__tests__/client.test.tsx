import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockGetBookingById,
    mockCreateConversation,
    mockCancelBooking,
    mockRespondToBookingRequest,
    mockUploadPaymentReceipt,
    mockUseAuth,
    mockRouterPush,
    mockShowToast,
} = vi.hoisted(() => ({
    mockGetBookingById: vi.fn(),
    mockCreateConversation: vi.fn(),
    mockCancelBooking: vi.fn(),
    mockRespondToBookingRequest: vi.fn(),
    mockUploadPaymentReceipt: vi.fn(),
    mockUseAuth: vi.fn(),
    mockRouterPush: vi.fn(),
    mockShowToast: vi.fn(),
}));

vi.mock('next/image', () => ({
    default: (props: any) => <img {...props} alt={props.alt} />,
}));

vi.mock('@/services/supabaseService', () => ({
    supabaseService: {
        getBookingById: mockGetBookingById,
        createConversation: mockCreateConversation,
        cancelBooking: mockCancelBooking,
        respondToBookingRequest: mockRespondToBookingRequest,
        uploadPaymentReceipt: mockUploadPaymentReceipt,
    },
}));

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({
        showToast: mockShowToast,
    }),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

import BookingDetailsClient from '../client';

function makeBooking(overrides: Record<string, unknown> = {}) {
    return {
        id: 'booking-1',
        propertyId: 'property-1',
        userId: 'tenant-1',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        totalNights: 2,
        rentalType: 'daily',
        tenantName: 'Tenant One',
        tenantPhone: '01000000000',
        tenantEmail: 'tenant@example.com',
        basePrice: 2000,
        serviceFee: 200,
        depositAmount: 0,
        totalAmount: 2200,
        paymentMethod: 'instapay',
        paymentStatus: 'pending',
        paymentProof: undefined,
        status: 'requested',
        createdAt: '2026-04-01T10:00:00Z',
        confirmedAt: undefined,
        landlordNote: 'تمت مراجعة الطلب وسنؤكد الموعد قريباً.',
        landlordNoteUpdatedAt: '2026-04-01T12:00:00Z',
        property: {
            id: 'property-1',
            title: 'Sea View Chalet',
            description: '',
            price: 1000,
            priceUnit: 'day',
            category: 'chalet',
            status: 'available',
            images: ['booking.jpg'],
            location: { lat: null, lng: null, address: 'Gamasa', area: 'Gamasa' },
            ownerPhone: '01111111111',
            ownerId: 'owner-1',
            ownerName: 'Owner One',
            features: [],
            bedrooms: 2,
            bathrooms: 1,
            area: 90,
            floor: 1,
            isVerified: true,
            viewsCount: 10,
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
        },
        user: {
            id: 'tenant-1',
            fullName: 'Tenant One',
            phone: '01000000000',
            email: 'tenant@example.com',
        },
        ...overrides,
    };
}

describe('BookingDetailsClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({
            user: { id: 'tenant-1', role: 'tenant' },
            loading: false,
        });
        mockGetBookingById.mockResolvedValue({
            data: makeBooking(),
            error: null,
        });
    });

    it('renders the tenant dashboard with invoice, note, and receipt upload', async () => {
        render(<BookingDetailsClient bookingId="booking-1" isCreatedFlow={true} entryView="tenant" />);

        expect(await screen.findByText('تم إرسال طلب الحجز بنجاح')).toBeInTheDocument();
        expect(screen.getByText('الفاتورة')).toBeInTheDocument();
        expect(screen.getByText('رسالة المؤجر')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /إلغاء الحجز/ }).length).toBeGreaterThan(0);
        expect(screen.getByText('اختيار صورة الإيصال')).toBeInTheDocument();
    });

    it('renders the landlord dashboard with tenant data and decision controls', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'owner-1', role: 'landlord' },
            loading: false,
        });

        render(<BookingDetailsClient bookingId="booking-1" isCreatedFlow={false} entryView="landlord" />);

        expect(await screen.findByText('بيانات المستأجر')).toBeInTheDocument();
        expect(screen.getByText('صافي الأرباح')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /قبول/ }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', { name: /رفض/ }).length).toBeGreaterThan(0);
        expect(screen.getByText('Tenant One')).toBeInTheDocument();
        // Landlord shouldn't see payment transfer number
        expect(screen.queryByText('الرقم المخصص للتحويل')).not.toBeInTheDocument();
    });

    it('falls back to role inference if entryView is invalid (security check)', async () => {
        // User is tenant, but tries to pass entryView="landlord"
        mockUseAuth.mockReturnValue({
            user: { id: 'tenant-1', role: 'tenant' },
            loading: false,
        });

        render(<BookingDetailsClient bookingId="booking-1" isCreatedFlow={false} entryView="landlord" />);
        
        // Should fallback to tenant view since they don't own the property
        expect(await screen.findByText('الفاتورة')).toBeInTheDocument();
        expect(screen.queryByText('بيانات المستأجر')).not.toBeInTheDocument();
    });

    it('falls back to role inference if no entryView is provided', async () => {
        render(<BookingDetailsClient bookingId="booking-1" isCreatedFlow={false} />);
        expect(await screen.findByText('الفاتورة')).toBeInTheDocument();
    });

    it('renders the not found state when the booking cannot be loaded', async () => {
        mockGetBookingById.mockResolvedValue({
            data: null,
            error: new Error('denied'),
        });

        render(<BookingDetailsClient bookingId="booking-404" isCreatedFlow={false} />);

        expect(await screen.findByText('تعذر عرض الحجز')).toBeInTheDocument();
        expect(screen.getByText('لم نتمكن من العثور على هذا الحجز أو ليس لديك صلاحية الوصول إليه.')).toBeInTheDocument();
    });
});
