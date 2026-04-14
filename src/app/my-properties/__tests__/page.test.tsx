import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockUseAuth,
    mockUseMyProperties,
    mockUseMediaQuery,
    mockRouterBack,
    mockDeleteProperty,
    mockUpdateStatus,
    mockRefresh,
    mockGetIsMockMode,
} = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockUseMyProperties: vi.fn(),
    mockUseMediaQuery: vi.fn(),
    mockRouterBack: vi.fn(),
    mockDeleteProperty: vi.fn(),
    mockUpdateStatus: vi.fn(),
    mockRefresh: vi.fn(),
    mockGetIsMockMode: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useMyProperties', () => ({
    useMyProperties: (...args: any[]) => mockUseMyProperties(...args),
}));

vi.mock('@/hooks/useMediaQuery', () => ({
    useMediaQuery: (query: string) => mockUseMediaQuery(query),
}));

vi.mock('@/hooks/useToast', () => ({
    useToast: () => ({
        toast: {
            success: vi.fn(),
            error: vi.fn(),
        },
    }),
}));

vi.mock('@/config/constants', () => ({
    getIsMockMode: () => mockGetIsMockMode(),
}));

vi.mock('@/components/ProtectedRoute', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        back: mockRouterBack,
    }),
}));

vi.mock('@/components/MyPropertyCard', () => ({
    default: ({
        property,
        layout,
        onDelete,
    }: {
        property: { id: string; title: string };
        layout: string;
        onDelete: (id: string) => void;
    }) => (
        <div data-testid="my-property-card" data-layout={layout}>
            <span>{property.title}</span>
            <button type="button" aria-label={`delete-${property.title}`} onClick={() => onDelete(property.id)}>
                delete
            </button>
        </div>
    ),
}));

import MyPropertiesPage from '../page';

function setNavigatorOnline(value: boolean) {
    Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        value,
    });
}

function makeProperty(overrides: Record<string, unknown> = {}) {
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
        floor: 3,
        isVerified: false,
        viewsCount: 12,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        ...overrides,
    };
}

function setMyPropertiesReturn(overrides: Record<string, unknown> = {}) {
    mockUseMyProperties.mockReturnValue({
        properties: [makeProperty(), makeProperty({ id: 'p2', title: 'Property 2', category: 'villa', status: 'rented', price: 4500 })],
        loading: false,
        error: null,
        deleteProperty: mockDeleteProperty,
        updateStatus: mockUpdateStatus,
        refresh: mockRefresh,
        deletingId: null,
        ...overrides,
    });
}

describe('MyPropertiesPage', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        setNavigatorOnline(true);
        mockGetIsMockMode.mockReturnValue(false);
        mockUseMediaQuery.mockReturnValue(false);
        mockUseAuth.mockReturnValue({
            user: { id: 'user-123' },
            isAuthenticated: true,
            loading: false,
        });
        setMyPropertiesReturn();
    });

    it('renders a sticky mobile header with floating mobile controls', () => {
        render(<MyPropertiesPage />);

        const mobileHeader = screen.getByTestId('my-properties-mobile-header');
        expect(within(mobileHeader).getByText('عقاراتي')).toBeInTheDocument();
        expect(within(mobileHeader).getByRole('button', { name: 'الرجوع' })).toBeInTheDocument();
        expect(within(mobileHeader).getByRole('link', { name: 'إضافة عقار' })).toBeInTheDocument();

        expect(screen.getByTestId('my-properties-mobile-actions-bar')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'فتح فلترة وترتيب الموبايل' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'فتح الإحصاءات' })).toBeInTheDocument();
    });

    it('renders loading skeletons for mobile and desktop and hides mobile actions', () => {
        setMyPropertiesReturn({ properties: [], loading: true });

        render(<MyPropertiesPage />);

        expect(screen.getByTestId('my-properties-mobile-loading')).toBeInTheDocument();
        expect(screen.getByTestId('my-properties-desktop-loading')).toBeInTheDocument();
        expect(screen.queryByTestId('my-properties-mobile-actions-bar')).not.toBeInTheDocument();
    });

    it('hides mobile actions for error, empty, and unauthenticated states', () => {
        const { rerender } = render(<MyPropertiesPage />);

        setMyPropertiesReturn({ properties: [], error: 'boom' });
        rerender(<MyPropertiesPage />);
        expect(screen.queryByTestId('my-properties-mobile-actions-bar')).not.toBeInTheDocument();

        setMyPropertiesReturn({ properties: [], error: null });
        rerender(<MyPropertiesPage />);
        expect(screen.queryByTestId('my-properties-mobile-actions-bar')).not.toBeInTheDocument();

        mockUseAuth.mockReturnValue({
            user: null,
            isAuthenticated: false,
            loading: false,
        });
        rerender(<MyPropertiesPage />);
        expect(screen.getByText('سجّل الدخول أولاً')).toBeInTheDocument();
        expect(screen.queryByTestId('my-properties-mobile-actions-bar')).not.toBeInTheDocument();
    });

    it('opens the filter sheet as a dialog and returns focus to the trigger after closing', async () => {
        const user = userEvent.setup();

        render(<MyPropertiesPage />);

        const filterButton = screen.getByRole('button', { name: 'فتح فلترة وترتيب الموبايل' });
        filterButton.focus();

        await user.click(filterButton);

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('data-state', 'open');
        await waitFor(() => {
            expect(dialog.contains(document.activeElement)).toBe(true);
        });

        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
        expect(filterButton).toHaveFocus();
    });

    it('opens the stats sheet from the mobile actions bar', async () => {
        const user = userEvent.setup();

        render(<MyPropertiesPage />);

        await user.click(screen.getByRole('button', { name: 'فتح الإحصاءات' }));

        expect(await screen.findByTestId('my-properties-stats-sheet')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows desktop hero and reset only after activating a filter', async () => {
        const user = userEvent.setup();
        mockUseMediaQuery.mockReturnValue(true);

        render(<MyPropertiesPage />);

        expect(screen.getByTestId('my-properties-desktop-hero')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /إعادة التصفية/ })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /فيلا/ }));

        expect(await screen.findByRole('button', { name: /إعادة التصفية/ })).toBeInTheDocument();
        expect(screen.getAllByTestId('my-property-card')).toHaveLength(1);
        expect(screen.getByText('Property 2')).toBeInTheDocument();
    });

    it('renders offline and mock indicators when runtime status is active', () => {
        setNavigatorOnline(false);
        mockGetIsMockMode.mockReturnValue(true);

        render(<MyPropertiesPage />);

        expect(screen.getAllByText('غير متصل').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Mock').length).toBeGreaterThan(0);
    });

    it('switches desktop card layout without scrolling away from the current position', async () => {
        const user = userEvent.setup();
        mockUseMediaQuery.mockReturnValue(true);
        const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

        render(<MyPropertiesPage />);

        expect(screen.getAllByTestId('my-property-card')[0]).toHaveAttribute('data-layout', 'grid');

        await user.click(screen.getByRole('button', { name: 'عرض القائمة' }));

        expect(screen.getAllByTestId('my-property-card')[0]).toHaveAttribute('data-layout', 'list');
        expect(screen.getAllByTestId('my-property-card')).toHaveLength(2);
        expect(scrollSpy).not.toHaveBeenCalled();

        scrollSpy.mockRestore();
    });

    it('uses the modal as the single delete confirmation path', async () => {
        const user = userEvent.setup();
        const confirmSpy = vi.spyOn(window, 'confirm');

        render(<MyPropertiesPage />);

        await user.click(screen.getByRole('button', { name: 'delete-Property 1' }));
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'نعم، احذف' }));

        expect(mockDeleteProperty).toHaveBeenCalledTimes(1);
        expect(mockDeleteProperty).toHaveBeenCalledWith('p1');
        expect(confirmSpy).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
    });

    it('navigates back from the header action', async () => {
        const user = userEvent.setup();

        render(<MyPropertiesPage />);

        await user.click(within(screen.getByTestId('my-properties-mobile-header')).getByRole('button', { name: 'الرجوع' }));

        expect(mockRouterBack).toHaveBeenCalledTimes(1);
    });
});
