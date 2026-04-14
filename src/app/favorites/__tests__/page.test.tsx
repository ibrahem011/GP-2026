import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetFavorites, mockFromPropertyRow, mockUseAuth, mockRouterBack } = vi.hoisted(() => ({
    mockGetFavorites: vi.fn(),
    mockFromPropertyRow: vi.fn(),
    mockUseAuth: vi.fn(),
    mockRouterBack: vi.fn(),
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

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        back: mockRouterBack,
    }),
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
        mockRouterBack.mockReset();
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
                category: row.category || 'apartment',
                price: row.price ?? 1500,
                features: row.features || [],
            }),
        );
    });

    it('renders a sticky mobile header with floating mobile controls', async () => {
        mockGetFavorites.mockResolvedValueOnce({
            data: [{ id: 'p1', title: 'Property 1', images: ['img1.jpg'] }],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByTestId('property-card')).toHaveTextContent('Property 1');
        const mobileHeader = screen.getByTestId('favorites-mobile-header');

        expect(within(mobileHeader).getByText('المفضلة')).toBeInTheDocument();
        expect(within(mobileHeader).getByRole('button', { name: 'الرجوع' })).toBeInTheDocument();
        expect(mobileHeader).toHaveClass('top-0');
        expect(screen.getByTestId('favorites-desktop-hero')).toHaveClass('hidden', 'md:block');
        expect(screen.getByTestId('favorites-mobile-actions-bar')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'فتح فلترة وترتيب الموبايل' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'فتح الإحصاءات' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'فتح فلترة وترتيب الدسكتوب' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'فتح فلترة الموبايل' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'فتح إحصاءات الموبايل' })).not.toBeInTheDocument();
    });

    it('navigates back from the mobile header button', async () => {
        const user = userEvent.setup();

        mockGetFavorites.mockResolvedValueOnce({
            data: [{ id: 'p1', title: 'Property 1', images: ['img1.jpg'] }],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByText('Property 1')).toBeInTheDocument();

        await user.click(
            within(screen.getByTestId('favorites-mobile-header')).getByRole('button', {
                name: 'الرجوع',
            }),
        );

        expect(mockRouterBack).toHaveBeenCalledTimes(1);
    });

    it('renders an empty state when there are no favorites', async () => {
        mockGetFavorites.mockResolvedValueOnce({
            data: [],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByText('لا توجد عقارات مفضلة')).toBeInTheDocument();
        expect(screen.queryByTestId('favorites-mobile-actions-bar')).not.toBeInTheDocument();
    });

    it('renders loading placeholders while favorites are being fetched', () => {
        mockGetFavorites.mockReturnValue(new Promise(() => {}));

        const { container } = render(<FavoritesPage />);

        expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
        expect(screen.queryByTestId('favorites-mobile-actions-bar')).not.toBeInTheDocument();
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

        expect(
            await screen.findByText('فشل جلب المفضلات. يرجى المحاولة مرة أخرى.'),
        ).toBeInTheDocument();
        expect(screen.queryByTestId('favorites-mobile-actions-bar')).not.toBeInTheDocument();

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

    it('renders the unauthenticated state when the user is signed out', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            isAuthenticated: false,
            loading: false,
        });

        render(<FavoritesPage />);

        expect(screen.getByText('سجّل الدخول أولاً')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /تسجيل الدخول/ })).toBeInTheDocument();
        expect(mockGetFavorites).not.toHaveBeenCalled();
        expect(screen.queryByTestId('favorites-mobile-actions-bar')).not.toBeInTheDocument();
    });

    it('applies category and price filters from the combined sheet', async () => {
        const user = userEvent.setup();

        mockGetFavorites.mockResolvedValueOnce({
            data: [
                { id: 'p1', title: 'Property 1', category: 'apartment', price: 1500, images: ['img1.jpg'] },
                { id: 'p2', title: 'Property 2', category: 'villa', price: 4500, images: ['img2.jpg'] },
            ],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByText('Property 1')).toBeInTheDocument();
        expect(screen.getByText('Property 2')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'فتح فلترة وترتيب الموبايل' }));

        const sheet = await screen.findByTestId('favorites-filter-sheet');
        await user.click(within(sheet).getByRole('button', { name: /فيلا/ }));
        await user.type(within(sheet).getByLabelText('من'), '3000');
        await user.click(screen.getByRole('button', { name: 'عرض النتائج' }));

        await waitFor(() => {
            expect(screen.queryByText('Property 1')).not.toBeInTheDocument();
            expect(screen.getByText('Property 2')).toBeInTheDocument();
        });
    });

    it('opens the stats sheet from the floating mobile actions bar', async () => {
        const user = userEvent.setup();

        mockGetFavorites.mockResolvedValueOnce({
            data: [{ id: 'p1', title: 'Property 1', images: ['img1.jpg'] }],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByText('Property 1')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'فتح الإحصاءات' }));

        expect(await screen.findByText('إحصاءات المفضلة')).toBeInTheDocument();
        expect(screen.getByTestId('favorites-stats-sheet')).toBeInTheDocument();
    });

    it('shows the desktop reset button only after activating filters', async () => {
        const user = userEvent.setup();

        mockGetFavorites.mockResolvedValueOnce({
            data: [
                { id: 'p1', title: 'Property 1', category: 'apartment', price: 1500, images: ['img1.jpg'] },
                { id: 'p2', title: 'Property 2', category: 'villa', price: 4500, images: ['img2.jpg'] },
            ],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByText('Property 1')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /إعادة التصفية/ })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'فتح فلترة وترتيب الدسكتوب' }));
        const sheet = await screen.findByTestId('favorites-filter-sheet');
        await user.click(within(sheet).getByRole('button', { name: /فيلا/ }));
        await user.click(screen.getByRole('button', { name: 'عرض النتائج' }));

        expect(await screen.findByRole('button', { name: /إعادة التصفية/ })).toBeInTheDocument();
    });
});
