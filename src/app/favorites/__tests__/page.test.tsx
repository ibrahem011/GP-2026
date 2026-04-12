import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetFavorites, mockFromPropertyRow, mockUseAuth } = vi.hoisted(() => ({
    mockGetFavorites: vi.fn(),
    mockFromPropertyRow: vi.fn(),
    mockUseAuth: vi.fn(),
}));

vi.mock('@/services/supabaseService', () => ({
    supabaseService: {
        getFavorites: mockGetFavorites,
    },
}));

vi.mock('@/lib/propertyMapper', () => ({
    fromPropertyRow: (...args: any[]) => mockFromPropertyRow(...args),
}));

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/PropertyCard', () => ({
    PropertyCard: ({
        title,
        onFavoriteChange,
    }: {
        title: string;
        onFavoriteChange?: (isFavorite: boolean) => void;
    }) => (
        <div>
            <div data-testid="property-card">{title}</div>
            <button type="button" aria-label={`remove-${title}`} onClick={() => onFavoriteChange?.(false)}>
                remove
            </button>
        </div>
    ),
}));

import FavoritesPage from '../page';

function makeMappedProperty(overrides: Record<string, unknown> = {}) {
    return {
        id: 'p1',
        title: 'Property 1',
        description: '',
        price: 1500,
        priceUnit: 'day',
        category: 'apartment',
        status: 'available',
        images: ['img1.jpg'],
        location: {
            lat: null,
            lng: null,
            address: 'Corniche',
            area: 'Gamasa',
        },
        ownerPhone: '',
        ownerId: 'owner-1',
        ownerName: 'Owner',
        features: [],
        bedrooms: 2,
        bathrooms: 1,
        area: 120,
        floor: 1,
        isVerified: false,
        viewsCount: 0,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        ...overrides,
    };
}

describe('FavoritesPage', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetFavorites.mockReset();
        mockFromPropertyRow.mockReset();
        mockUseAuth.mockReset();
        mockUseAuth.mockReturnValue({
            user: { id: 'user-123' },
            isAuthenticated: true,
            loading: false,
        });
        mockFromPropertyRow.mockImplementation((row: any) =>
            makeMappedProperty({
                id: row.id,
                title: row.title,
                images: row.images || ['img1.jpg'],
            }),
        );
    });

    it('renders favorite properties when the fetch succeeds', async () => {
        mockGetFavorites.mockResolvedValueOnce({
            data: [{ id: 'p1', title: 'Property 1', images: ['img1.jpg'] }],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByTestId('property-card')).toHaveTextContent('Property 1');
        expect(screen.getAllByText('١').length).toBeGreaterThan(0);
    });

    it('renders an empty state when there are no favorites', async () => {
        mockGetFavorites.mockResolvedValueOnce({
            data: [],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByText('لا توجد عقارات مفضلة')).toBeInTheDocument();
    });

    it('renders an error state and retries the request', async () => {
        const user = userEvent.setup();

        mockGetFavorites
            .mockResolvedValueOnce({
                data: [],
                error: new Error('boom'),
            })
            .mockResolvedValueOnce({
                data: [{ id: 'p2', title: 'Property 2', images: ['img2.jpg'] }],
                error: null,
            });

        render(<FavoritesPage />);

        expect(await screen.findByText('فشل جلب المفضلات. يرجى المحاولة مرة أخرى.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /إعادة المحاولة/ }));

        await waitFor(() => {
            expect(screen.getByTestId('property-card')).toHaveTextContent('Property 2');
        });
    });

    it('removes a property from the page when it is unfavorited from the card', async () => {
        const user = userEvent.setup();

        mockGetFavorites.mockResolvedValueOnce({
            data: [{ id: 'p1', title: 'Property 1', images: ['img1.jpg'] }],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByTestId('property-card')).toHaveTextContent('Property 1');

        await user.click(screen.getByRole('button', { name: 'remove-Property 1' }));

        await waitFor(() => {
            expect(screen.queryByTestId('property-card')).not.toBeInTheDocument();
        });

        expect(screen.getByText('لا توجد عقارات مفضلة')).toBeInTheDocument();
    });
});
