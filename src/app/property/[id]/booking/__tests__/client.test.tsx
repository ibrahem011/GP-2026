import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockUseAuth,
    mockRouterPush,
    mockRouterBack,
    mockGetTenantPropertyState,
    mockGetProfile,
    mockCalculateTotalPrice,
    mockCheckAvailability,
    mockCreateBooking,
} = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockRouterPush: vi.fn(),
    mockRouterBack: vi.fn(),
    mockGetTenantPropertyState: vi.fn(),
    mockGetProfile: vi.fn(),
    mockCalculateTotalPrice: vi.fn(),
    mockCheckAvailability: vi.fn(),
    mockCreateBooking: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockRouterPush,
        back: mockRouterBack,
    }),
}));

vi.mock('next/image', () => ({
    default: ({ fill: _fill, ...props }: any) => <img {...props} alt={props.alt} />,
}));

vi.mock('@/services/supabaseService', () => ({
    getIsMockMode: () => false,
    supabaseService: {
        getTenantPropertyState: mockGetTenantPropertyState,
        getProfile: mockGetProfile,
        calculateTotalPrice: mockCalculateTotalPrice,
        checkAvailability: mockCheckAvailability,
        createBooking: mockCreateBooking,
    },
}));

vi.mock('@/components/booking/DateSelector', () => ({
    default: ({ startDate, endDate, onStartDateChange, onEndDateChange }: any) => (
        <div>
            <input aria-label="start-date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
            <input aria-label="end-date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} />
        </div>
    ),
}));

vi.mock('@/components/booking/PaymentMethods', () => ({
    default: ({ onMethodChange }: any) => (
        <div>
            <button type="button" onClick={() => onMethodChange('instapay')}>إنستاباي</button>
        </div>
    ),
}));

vi.mock('@/components/booking/PriceBreakdown', () => ({
    default: () => <div>تفاصيل الفاتورة</div>,
}));

import BookingPageClient from '../client';

const validUserId = '550e8400-e29b-41d4-a716-446655440000';
const validPropertyId = '550e8400-e29b-41d4-a716-446655440001';
const propertyFixture = {
    id: validPropertyId,
    owner_id: 'owner-1',
    title: 'Sea View Chalet',
    description: 'desc',
    price: 1000,
    price_unit: 'day',
    category: 'chalet',
    status: 'available',
    images: ['booking.jpg'],
    address: 'Gamasa',
    area: 'Gamasa',
    bedrooms: 2,
    bathrooms: 1,
    floor_area: 90,
    floor_number: 1,
    features: [],
    owner_phone: '01111111111',
    owner_name: 'Owner One',
    is_verified: true,
    views_count: 10,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
};

const nextPattern = /التالي/u;
const confirmPattern = /تأكيد الحجز/u;
const paymentPattern = /إنستاباي/u;

function renderBookingPage() {
    return render(<BookingPageClient propertyId={validPropertyId} initialProperty={propertyFixture as any} />);
}

async function moveToStep2(user: ReturnType<typeof userEvent.setup>) {
    renderBookingPage();

    const startInput = await screen.findByLabelText('start-date');
    const endInput = await screen.findByLabelText('end-date');

    await user.clear(startInput);
    await user.type(startInput, '2026-04-10');
    await user.clear(endInput);
    await user.type(endInput, '2026-04-12');

    await waitFor(() => {
        expect(mockCheckAvailability).toHaveBeenCalled();
    });

    await user.click(screen.getAllByRole('button', { name: nextPattern })[0]);

    await waitFor(() => {
        expect(document.getElementById('tenant-name')).toBeInTheDocument();
    });
}

describe('BookingPageClient step 2 tenant data flow', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        window.scrollTo = vi.fn();
        Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: vi.fn(),
        });

        mockUseAuth.mockReturnValue({
            user: {
                id: validUserId,
                name: 'Tenant User',
                email: 'tenant@example.com',
                phone: '01000000000',
            },
            loading: false,
        });
        mockGetTenantPropertyState.mockResolvedValue({
            unlockedAt: '2026-04-01T00:00:00Z',
            unlockRequestStatus: 'approved',
            latestBooking: null,
            hasBookingHistory: true,
        });
        mockGetProfile.mockResolvedValue(null);
        mockCalculateTotalPrice.mockReturnValue({
            basePrice: 2000,
            serviceFee: 200,
            depositAmount: 0,
            totalAmount: 2200,
            duration: 2,
        });
        mockCheckAvailability.mockResolvedValue({
            available: true,
            error: null,
        });
        mockCreateBooking.mockResolvedValue({
            data: { id: 'booking-new' },
            error: null,
        });
    });

    it('shows validation errors after pressing next and focuses the first invalid field', async () => {
        const user = userEvent.setup();
        await moveToStep2(user);

        const nameInput = document.getElementById('tenant-name') as HTMLInputElement;
        const emailInput = document.getElementById('tenant-email') as HTMLInputElement;

        await user.clear(nameInput);
        await user.clear(emailInput);
        await user.type(emailInput, 'bad-email');
        await user.click(screen.getAllByRole('button', { name: nextPattern })[0]);

        expect(await screen.findByText(/يرجى إدخال الاسم الكامل/u)).toBeInTheDocument();
        expect(screen.getByText(/يرجى إدخال بريد إلكتروني صحيح/u)).toBeInTheDocument();

        await waitFor(() => {
            expect(document.activeElement).toBe(nameInput);
        });
    });

    it('accepts +20 phone format, normalizes it, and submits the booking', async () => {
        const user = userEvent.setup();
        mockUseAuth.mockReturnValue({
            user: {
                id: validUserId,
                name: 'Tenant User',
                email: 'tenant@example.com',
                phone: '',
            },
            loading: false,
        });

        await moveToStep2(user);

        const phoneInput = document.getElementById('tenant-phone') as HTMLInputElement;
        await user.clear(phoneInput);
        await user.type(phoneInput, '+201000000000');
        await user.tab();

        await waitFor(() => {
            expect(phoneInput.value).toBe('01000000000');
        });

        await user.click(screen.getAllByRole('button', { name: nextPattern })[0]);
        await user.click(screen.getByRole('button', { name: paymentPattern }));
        await user.click(screen.getAllByRole('button', { name: nextPattern })[0]);
        await user.click(screen.getAllByRole('button', { name: confirmPattern })[0]);

        await waitFor(() => {
            expect(mockCreateBooking).toHaveBeenCalledWith(expect.objectContaining({
                tenantPhone: '01000000000',
            }));
        });

        expect(mockRouterPush).toHaveBeenCalledWith('/bookings/booking-new?created=1');
    });

    it('accepts Arabic numerals for the tenant phone and proceeds to payment', async () => {
        const user = userEvent.setup();
        mockUseAuth.mockReturnValue({
            user: {
                id: validUserId,
                name: 'Tenant User',
                email: 'tenant@example.com',
                phone: '',
            },
            loading: false,
        });

        await moveToStep2(user);

        const phoneInput = document.getElementById('tenant-phone') as HTMLInputElement;
        await user.clear(phoneInput);
        await user.type(phoneInput, '٠١٠٠٠٠٠٠٠٠٠');

        await waitFor(() => {
            expect(phoneInput.value).toBe('01000000000');
        });

        await user.click(screen.getAllByRole('button', { name: nextPattern })[0]);

        expect(await screen.findByRole('button', { name: paymentPattern })).toBeInTheDocument();
        expect(screen.queryByText(/يرجى إدخال رقم موبايل مصري صحيح/u)).not.toBeInTheDocument();
    });

    it('shows a helper when the stored account or profile phone is invalid', async () => {
        const user = userEvent.setup();
        mockUseAuth.mockReturnValue({
            user: {
                id: validUserId,
                name: 'Tenant User',
                email: 'tenant@example.com',
                phone: '+15551234567',
            },
            loading: false,
        });
        mockGetProfile.mockResolvedValue({ phone: '12345' });

        await moveToStep2(user);

        expect(await screen.findByText(/رقم الهاتف المحفوظ في الحساب يحتاج مراجعة/u)).toBeInTheDocument();
    });
});
