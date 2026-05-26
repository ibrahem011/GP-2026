import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockGetFavorites,
    mockGetProfileStats,
    mockGetProperties,
    mockGetUnlockedProperties,
    mockRouterBack,
    mockUseAuth,
} = vi.hoisted(() => ({
    mockGetFavorites: vi.fn(),
    mockGetProfileStats: vi.fn(),
    mockGetProperties: vi.fn(),
    mockGetUnlockedProperties: vi.fn(),
    mockRouterBack: vi.fn(),
    mockUseAuth: vi.fn(),
}));

vi.mock('@/services/supabaseService', () => ({
    supabaseService: {
        getFavorites: mockGetFavorites,
        getProfileStats: mockGetProfileStats,
        getProperties: mockGetProperties,
        getUnlockedProperties: mockGetUnlockedProperties,
    },
}));

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/profile/EditProfileModal', () => ({
    default: () => null,
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        back: mockRouterBack,
    }),
}));

import ProfilePage from '../page';

function createAuthUser() {
    return {
        id: 'user-123',
        name: 'Profile User',
        phone: '01000000000',
        email: 'profile@example.com',
        role: 'tenant',
        favorites: [],
        unlockedProperties: [],
        isVerified: false,
        createdAt: '2026-01-01T00:00:00Z',
        memberSince: '2026-01-01T00:00:00Z',
    };
}

describe('ProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({
            user: createAuthUser(),
            loading: false,
            logout: vi.fn(),
        });
        mockGetProfileStats.mockResolvedValue({
            stats: { properties: 7, unlocked: 3, favorites: 2 },
            error: null,
            isTimeout: false,
        });
    });

    it('loads count-only profile stats with bounded options', async () => {
        render(<ProfilePage />);

        expect(await screen.findByText('Profile User')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockGetProfileStats).toHaveBeenCalledWith('user-123', {
                timeoutMs: 8_000,
                maxRetries: 0,
                retryOnTimeout: false,
                operationKey: 'profileStats',
            });
        });

        expect(mockGetProperties).not.toHaveBeenCalled();
        expect(mockGetUnlockedProperties).not.toHaveBeenCalled();
        expect(mockGetFavorites).not.toHaveBeenCalled();
        expect(await screen.findByText('7')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('renders a safe stats error state when count-only stats fail', async () => {
        mockGetProfileStats.mockResolvedValueOnce({
            stats: { properties: 0, unlocked: 0, favorites: 0 },
            error: { code: 'REQUEST_TIMEOUT', message: 'REQUEST_TIMEOUT' },
            isTimeout: true,
        });

        render(<ProfilePage />);

        expect(await screen.findByTestId('profile-stats-error')).toBeInTheDocument();
        expect(mockGetProperties).not.toHaveBeenCalled();
        expect(mockGetUnlockedProperties).not.toHaveBeenCalled();
        expect(mockGetFavorites).not.toHaveBeenCalled();
    });
});
