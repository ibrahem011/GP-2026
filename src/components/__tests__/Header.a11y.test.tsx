import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Header from '../Header';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock useAuth directly to bypass context setup issues
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test', name: 'Test', avatar: null },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <div>{children}</div>
}));

test('Header accessibility checks for authenticated state', () => {
    render(<Header />);

    // Check Notification button
    const notifBtn = screen.getByRole('button', { name: 'الإشعارات' });
    expect(notifBtn).toBeInTheDocument();

    // Check its internal icon is hidden
    const notifIcon = notifBtn.querySelector('.material-symbols-outlined');
    expect(notifIcon).toHaveAttribute('aria-hidden', 'true');

    // Check Logout button
    const logoutBtn = screen.getByRole('button', { name: 'تسجيل الخروج' });
    expect(logoutBtn).toBeInTheDocument();

    // Check its internal icon is hidden
    const logoutIcon = logoutBtn.querySelector('.material-symbols-outlined');
    expect(logoutIcon).toHaveAttribute('aria-hidden', 'true');
});
