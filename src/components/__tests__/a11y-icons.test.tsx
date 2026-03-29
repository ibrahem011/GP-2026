import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { expect, describe, it, vi, beforeAll } from 'vitest';
import { BottomNav } from '../BottomNav';
import Header from '../Header';

// Mock matchMedia for jsdom
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock Next.js routing
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock Auth context
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

describe('Accessibility for Decorative Material Icons', () => {
  it('BottomNav icons should have aria-hidden', () => {
    const { container } = render(<BottomNav />);
    const icons = container.querySelectorAll('.material-symbols-outlined');
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach(icon => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('Header icons should have aria-hidden and aria-label for icon buttons', () => {
    const { container } = render(<Header />);
    const icons = container.querySelectorAll('.material-symbols-outlined');
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach(icon => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    // Check aria labels on the buttons
    const notifBtn = screen.getByRole('button', { name: /الإشعارات/i });
    expect(notifBtn).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /تسجيل الخروج/i });
    expect(logoutBtn).toBeInTheDocument();
  });
});
