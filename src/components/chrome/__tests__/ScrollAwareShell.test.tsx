import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUsePathname, mockUseMediaQuery } = vi.hoisted(() => ({
    mockUsePathname: vi.fn(),
    mockUseMediaQuery: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => mockUsePathname(),
}));

vi.mock('@/hooks/useMediaQuery', () => ({
    useMediaQuery: (query: string) => mockUseMediaQuery(query),
}));

vi.mock('@/components/Header', () => ({
    default: () => <div data-testid="global-header">Header</div>,
}));

vi.mock('@/components/BottomNav', () => ({
    BottomNav: () => <div data-testid="global-bottom-nav">BottomNav</div>,
}));

import ScrollAwareShell from '../ScrollAwareShell';

describe('ScrollAwareShell', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePathname.mockReturnValue('/favorites');
        mockUseMediaQuery.mockReturnValue(false);
    });

    it('hides the global header and bottom nav on favorites mobile', () => {
        const { container } = render(
            <ScrollAwareShell>
                <div data-testid="shell-children">Content</div>
            </ScrollAwareShell>,
        );

        expect(screen.getByTestId('shell-children')).toBeInTheDocument();
        expect(screen.queryByTestId('global-header')).not.toBeInTheDocument();
        expect(screen.queryByTestId('global-bottom-nav')).not.toBeInTheDocument();
        expect(container.querySelector('main')).not.toHaveClass('pb-[var(--chrome-bottom)]');
    });

    it('keeps the global header and bottom nav on favorites desktop', () => {
        mockUseMediaQuery.mockReturnValue(true);

        const { container } = render(
            <ScrollAwareShell>
                <div data-testid="shell-children">Content</div>
            </ScrollAwareShell>,
        );

        expect(screen.getByTestId('shell-children')).toBeInTheDocument();
        expect(screen.getByTestId('global-header')).toBeInTheDocument();
        expect(screen.getByTestId('global-bottom-nav')).toBeInTheDocument();
        expect(container.querySelector('main')).toHaveClass('pb-[var(--chrome-bottom)]', 'md:pb-0');
    });

    it('keeps the global header and bottom nav on home mobile', () => {
        mockUsePathname.mockReturnValue('/');

        const { container } = render(
            <ScrollAwareShell>
                <div data-testid="shell-children">Content</div>
            </ScrollAwareShell>,
        );

        expect(screen.getByTestId('shell-children')).toBeInTheDocument();
        expect(screen.getByTestId('global-header')).toBeInTheDocument();
        expect(screen.getByTestId('global-bottom-nav')).toBeInTheDocument();
        expect(container.querySelector('main')).toHaveClass('pb-[var(--chrome-bottom)]', 'md:pb-0');
    });
});
