import { render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import BookingConfirmationPage from '../page';
import { redirect } from 'next/navigation';

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

describe('BookingConfirmationPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirects to bookings page when no bookingId is provided', async () => {
        const searchParams = Promise.resolve({});
        
        await BookingConfirmationPage({ searchParams });
        
        expect(redirect).toHaveBeenCalledWith('/bookings');
    });

    it('redirects to booking details with created=1 when bookingId is provided', async () => {
        const searchParams = Promise.resolve({ bookingId: '123' });
        
        await BookingConfirmationPage({ searchParams });
        
        expect(redirect).toHaveBeenCalledWith('/bookings/123?created=1');
    });
});
