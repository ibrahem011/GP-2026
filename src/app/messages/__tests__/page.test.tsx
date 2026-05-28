import { render, screen } from '@testing-library/react';
import MessagesPage from '@/app/messages/page';
import { AuthProvider } from '@/context/AuthContext';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'test-user', full_name: 'Test' },
        isAuthenticated: true
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@/services/supabaseService', () => ({
    supabaseService: {
        getUserConversations: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        back: vi.fn(),
        push: vi.fn()
    })
}));

describe('MessagesPage Accessibility', () => {
    it('has aria-hidden="true" on material-symbols-outlined inside icon buttons', () => {
        render(<MessagesPage />);

        // Find the back button and support button
        const backButton = screen.getByLabelText('الرجوع');
        const supportButton = screen.getByLabelText('الدعم الفني');

        expect(backButton).toBeInTheDocument();
        expect(supportButton).toBeInTheDocument();

        // Find the spans inside them and verify aria-hidden
        const backIcon = backButton.querySelector('span.material-symbols-outlined');
        expect(backIcon).toHaveAttribute('aria-hidden', 'true');

        const supportIcon = supportButton.querySelector('span.material-symbols-outlined');
        expect(supportIcon).toHaveAttribute('aria-hidden', 'true');
    });
});
