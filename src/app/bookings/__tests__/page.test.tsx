import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetUserBookings, mockUseAuth, mockRouterPush, mockGetIsMockMode } = vi.hoisted(() => ({
    mockGetUserBookings: vi.fn(),
    mockUseAuth: vi.fn(),
    mockRouterPush: vi.fn(),
    mockGetIsMockMode: vi.fn(),
}));

vi.mock('@/services/supabaseService', () => ({
    getIsMockMode: () => mockGetIsMockMode(),
    supabaseService: {
        getUserBookings: mockGetUserBookings,
        createConversation: vi.fn(),
        cancelBooking: vi.fn(),
        respondToBookingRequest: vi.fn(),
    },
}));

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

import BookingsPage from '../page';

function makeServiceBooking(overrides: Record<string, unknown> = {}) {
    return {
        id: 'booking-1',
        propertyId: 'property-1',
        userId: 'user-123',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        totalAmount: 2400,
        status: 'requested',
        createdAt: '2026-04-01T00:00:00Z',
        tenantName: 'Tenant One',
        bookingType: 'tenant',
        property: {
            id: 'property-1',
            title: 'Sea View Chalet',
            images: ['booking.jpg'],
            area: 'Gamasa',
            ownerId: 'owner-1',
            ownerName: 'Owner One',
            ownerPhone: '01000000000',
        },
        user: null,
        ...overrides,
    };
}

const genericErrorPattern = /تعذر تحميل الحجوزات\. يرجى المحاولة مرة أخرى لاحقاً\./u;
const timeoutErrorPattern = /تأخرت استجابة الخادم\. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى\./u;
const timeoutHelpPattern = /يرجى التحقق من اتصالك والمحاولة لاحقاً\./u;
const retryPattern = /المحاولة مرة أخرى/u;
const tripsTabPattern = /حجوزاتي/u;
const detailsPattern = /تفاصيل الحجز/u;

describe('BookingsPage', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetUserBookings.mockReset();
        mockUseAuth.mockReset();
        mockRouterPush.mockReset();
        mockGetIsMockMode.mockReset();
        mockGetIsMockMode.mockReturnValue(false);
        mockUseAuth.mockReturnValue({
            user: { id: 'user-123', role: 'tenant' },
            loading: false,
        });
    });

    it('renders the generic error state when bookings fail to load', async () => {
        mockGetUserBookings.mockResolvedValueOnce({
            bookings: [],
            error: new Error('boom'),
            isTimeout: false,
        });

        render(<BookingsPage />);

        expect(await screen.findByText(genericErrorPattern)).toBeInTheDocument();
        expect(screen.queryByText(timeoutHelpPattern)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: retryPattern })).toBeInTheDocument();
    });

    it('renders the timeout state with extra guidance', async () => {
        mockGetUserBookings.mockResolvedValueOnce({
            bookings: [],
            error: { code: 'REQUEST_TIMEOUT', message: 'REQUEST_TIMEOUT' },
            isTimeout: true,
        });

        render(<BookingsPage />);

        expect(await screen.findByText(timeoutErrorPattern)).toBeInTheDocument();
        expect(screen.getByText(timeoutHelpPattern)).toBeInTheDocument();
    });

    it('retries after an error and renders the unified booking card on recovery', async () => {
        const user = userEvent.setup();

        mockGetUserBookings
            .mockResolvedValueOnce({
                bookings: [],
                error: new Error('boom'),
                isTimeout: false,
            })
            .mockResolvedValueOnce({
                bookings: [makeServiceBooking()],
                error: null,
                isTimeout: false,
            });

        render(<BookingsPage />);

        expect(await screen.findByText(genericErrorPattern)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: retryPattern }));

        await waitFor(() => {
            expect(screen.getAllByText('Sea View Chalet').length).toBeGreaterThan(0);
        });

        expect(screen.getByRole('button', { name: tripsTabPattern })).toBeInTheDocument();
        const detailsLinks = screen.getAllByRole('link', { name: detailsPattern });
        expect(detailsLinks.length).toBeGreaterThan(0);
        expect(detailsLinks[0]).toHaveAttribute('href', '/bookings/booking-1?view=tenant');
        expect(screen.queryByText(genericErrorPattern)).not.toBeInTheDocument();
    });
});
