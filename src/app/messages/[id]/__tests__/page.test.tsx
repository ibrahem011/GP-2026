import { render, screen } from '@testing-library/react';
import ChatPage from '@/app/messages/[id]/page';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'test-user', full_name: 'Test' },
        isAuthenticated: true
    }),
}));

vi.mock('@/services/supabaseService', () => ({
    supabaseService: {
        getConversationDetails: vi.fn().mockResolvedValue(null),
        getMessages: vi.fn().mockResolvedValue([]),
        markMessagesAsRead: vi.fn(),
        subscribeToTypingIndicator: vi.fn(() => vi.fn())
    }
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        back: vi.fn(),
    })
}));

describe('ChatPage Accessibility', () => {
    it('has aria-hidden="true" on material-symbols-outlined inside icon buttons in the header', async () => {
        const params = Promise.resolve({ id: 'test-conversation-123' });

        render(<ChatPage params={params} />);

        // Wait for the component to load
        const backButton = await screen.findByLabelText('الرجوع');
        const callButton = screen.getByLabelText('اتصال');
        const moreButton = screen.getByLabelText('خيارات إضافية');

        expect(backButton).toBeInTheDocument();
        expect(callButton).toBeInTheDocument();
        expect(moreButton).toBeInTheDocument();

        const backIcon = backButton.querySelector('span.material-symbols-outlined');
        expect(backIcon).toHaveAttribute('aria-hidden', 'true');

        const callIcon = callButton.querySelector('span.material-symbols-outlined');
        expect(callIcon).toHaveAttribute('aria-hidden', 'true');

        const moreIcon = moreButton.querySelector('span.material-symbols-outlined');
        expect(moreIcon).toHaveAttribute('aria-hidden', 'true');
    });
});
