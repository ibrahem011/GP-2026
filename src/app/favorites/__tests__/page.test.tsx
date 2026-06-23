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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        id,
        title,
        onFavoriteChange,
    }: {
        id: string;
        title: string;
        onFavoriteChange?: (isFavorite: boolean, id: string) => void;
    }) => (
        <div>
            <div data-testid="property-card">{title}</div>
            <button type="button" aria-label={`remove-${title}`} onClick={() => onFavoriteChange?.(false, id)}>
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    it('renders mobile header with floating controls and desktop controls', async () => {
        mockGetFavorites.mockResolvedValueOnce({
            data: [{ id: 'p1', title: 'Property 1', images: ['img1.jpg'] }],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByTestId('property-card')).toHaveTextContent('Property 1');
        const mobileHeader = screen.getByTestId('favorites-mobile-header');

        expect(within(mobileHeader).getByText('المفضلة')).toBeInTheDocument();
        expect(within(mobileHeader).getByRole('button', { name: 'الرجوع' })).toBeInTheDocument();
        expect(screen.getByTestId('favorites-desktop-hero')).toHaveClass('hidden', 'md:block');
        expect(screen.getByTestId('favorites-mobile-actions-bar')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'فتح فلترة وترتيب الموبايل' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'فتح الإحصاءات' })).toBeInTheDocument();
        expect(screen.getByTestId('favorites-desktop-controls')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'فتح فلترة وترتيب الدسكتوب' })).not.toBeInTheDocument();
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
                isTimeout: false,
            })
            .mockResolvedValueOnce({
                data: [{ id: 'p2', title: 'Property 2', images: ['img2.jpg'] }],
                error: null,
                isTimeout: false,
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

    it('renders a timeout state with extra guidance and retries the request', async () => {
        const user = userEvent.setup();

        mockGetFavorites
            .mockResolvedValueOnce({
                data: [],
                error: { code: 'REQUEST_TIMEOUT', message: 'REQUEST_TIMEOUT' },
                isTimeout: true,
            })
            .mockResolvedValueOnce({
                data: [{ id: 'p3', title: 'Property 3', images: ['img3.jpg'] }],
                error: null,
                isTimeout: false,
            });

        render(<FavoritesPage />);

        expect(
            await screen.findByText('انتهت مهلة تحميل المفضلات. تأكد من الاتصال ثم حاول مرة أخرى.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('الصفحة متاحة، لكن الخادم تأخر في الاستجابة.'),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /إعادة المحاولة/ }));

        await waitFor(() => {
            expect(screen.getByTestId('property-card')).toHaveTextContent('Property 3');
        });
        expect(
            screen.queryByText('الصفحة متاحة، لكن الخادم تأخر في الاستجابة.'),
        ).not.toBeInTheDocument();
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

    it('applies category and price filters directly on desktop controls', async () => {
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

        const controls = screen.getByTestId('favorites-desktop-controls');

        await user.click(within(controls).getByRole('button', { name: /فيلا/ }));

        await waitFor(() => {
            expect(screen.queryByText('Property 1')).not.toBeInTheDocument();
            expect(screen.getByText('Property 2')).toBeInTheDocument();
        });
    });

    it('applies price filter directly on desktop controls', async () => {
        const user = userEvent.setup();

        mockGetFavorites.mockResolvedValueOnce({
            data: [
                { id: 'p1', title: 'Property 1', price: 1500, images: ['img1.jpg'] },
                { id: 'p2', title: 'Property 2', price: 4500, images: ['img2.jpg'] },
            ],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByText('Property 1')).toBeInTheDocument();
        expect(screen.getByText('Property 2')).toBeInTheDocument();

        const controls = screen.getByTestId('favorites-desktop-controls');
        const minPriceInput = within(controls).getByPlaceholderText('من');

        await user.type(minPriceInput, '3000');

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

        const controls = screen.getByTestId('favorites-desktop-controls');
        await user.click(within(controls).getByRole('button', { name: /فيلا/ }));

        expect(await screen.findByRole('button', { name: /إعادة التصفية/ })).toBeInTheDocument();
    });

    it('removes an active filter pill and shows results restored', async () => {
        const user = userEvent.setup();

        mockGetFavorites.mockResolvedValueOnce({
            data: [
                { id: 'p1', title: 'Property 1', category: 'apartment', images: ['img1.jpg'] },
                { id: 'p2', title: 'Property 2', category: 'villa', images: ['img2.jpg'] },
            ],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByText('Property 1')).toBeInTheDocument();
        expect(screen.getByText('Property 2')).toBeInTheDocument();

        const controls = screen.getByTestId('favorites-desktop-controls');

        await user.click(within(controls).getAllByRole('button', { name: /فيلا/ })[0]);

        await waitFor(() => {
            expect(screen.queryByText('Property 1')).not.toBeInTheDocument();
        });

        const pillsSection = within(controls).getByText('الفلاتر النشطة:').parentElement;
        expect(pillsSection).not.toBeNull();
        const pillWithClose = pillsSection!.querySelector('button > .material-symbols-outlined');
        expect(pillWithClose).not.toBeNull();
        const pillButton = pillWithClose!.parentElement as HTMLButtonElement;
        await user.click(pillButton);

        await waitFor(() => {
            expect(screen.getByText('Property 1')).toBeInTheDocument();
            expect(screen.getByText('Property 2')).toBeInTheDocument();
        });
    });

    it('shows results count badge updates when filters are applied', async () => {
        const user = userEvent.setup();

        mockGetFavorites.mockResolvedValueOnce({
            data: [
                { id: 'p1', title: 'Property 1', category: 'apartment', images: ['img1.jpg'] },
                { id: 'p2', title: 'Property 2', category: 'villa', images: ['img2.jpg'] },
            ],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByText('Property 1')).toBeInTheDocument();

        const controls = screen.getByTestId('favorites-desktop-controls');
        const badge = within(controls).getByText((content) => content.includes('من') && content.includes('٢'));

        expect(badge.textContent).toMatch(/٢ من ٢/);

        await user.click(within(controls).getByRole('button', { name: /فيلا/ }));

        await waitFor(() => {
            const updatedBadge = within(controls).getByText((content) => content.includes('من') && content.includes('٢'));
            expect(updatedBadge.textContent).toMatch(/١ من ٢/);
        });
    });

    it('applies sort change directly on desktop controls', async () => {
        const user = userEvent.setup();

        mockGetFavorites.mockResolvedValueOnce({
            data: [
                { id: 'p1', title: 'Property 1', price: 1000, images: ['img1.jpg'] },
                { id: 'p2', title: 'Property 2', price: 5000, images: ['img2.jpg'] },
            ],
            error: null,
        });

        render(<FavoritesPage />);

        expect(await screen.findByText('Property 1')).toBeInTheDocument();
        expect(screen.getByText('Property 2')).toBeInTheDocument();

        const controls = screen.getByTestId('favorites-desktop-controls');
        const sortSelect = within(controls).getByRole('combobox', { name: 'ترتيب المفضلة' });

        await user.selectOptions(sortSelect, 'price_desc');

        const sortedCards = await screen.findAllByTestId('property-card');
        expect(sortedCards[0]).toHaveTextContent('Property 2');
        expect(sortedCards[1]).toHaveTextContent('Property 1');
    });
});