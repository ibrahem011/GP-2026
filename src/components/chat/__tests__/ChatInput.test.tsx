import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatInput } from '../ChatInput';

vi.mock('@/services/supabaseService', () => ({
  supabaseService: {
    uploadMedia: vi.fn(),
    sendMessage: vi.fn()
  }
}));

describe('ChatInput Accessibility', () => {
    const defaultProps = {
        conversationId: '123',
        currentUserId: '456',
        hasMediaPermission: true,
        onSendMessage: vi.fn(),
        onRequestPermission: vi.fn()
    };

    it('has an aria-label for the attachment button', () => {
        render(<ChatInput {...defaultProps} />);
        const attachBtn = screen.getAllByLabelText('إرفاق صورة')[0];
        expect(attachBtn).toBeInTheDocument();

        // Verify it has the focus ring classes
        expect(attachBtn).toHaveClass('focus-visible:ring-2');
        expect(attachBtn).toHaveClass('focus-visible:ring-primary');
        expect(attachBtn).toHaveClass('focus-visible:outline-none');

        // Verify the internal icon has aria-hidden
        const icon = attachBtn.querySelector('.material-symbols-outlined');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('has an aria-label for the emoji button', () => {
        render(<ChatInput {...defaultProps} />);
        const emojiBtn = screen.getAllByLabelText('إضافة رموز تعبيرية')[0];
        expect(emojiBtn).toBeInTheDocument();

        expect(emojiBtn).toHaveClass('focus-visible:ring-2');
        expect(emojiBtn).toHaveClass('focus-visible:outline-none');

        const icon = emojiBtn.querySelector('.material-symbols-outlined');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('has an aria-label for the mic button when empty', () => {
        render(<ChatInput {...defaultProps} />);
        const micBtn = screen.getAllByLabelText('تسجيل صوتي')[0];
        expect(micBtn).toBeInTheDocument();

        expect(micBtn).toHaveClass('focus-visible:ring-2');
        expect(micBtn).toHaveClass('focus-visible:outline-none');

        const icon = micBtn.querySelector('.material-symbols-outlined');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
});
