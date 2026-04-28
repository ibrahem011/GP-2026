import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Property } from '@/types';
import MyPropertyCard from '../MyPropertyCard';

vi.mock('next/image', () => ({
    default: ({
        alt,
        fill: _fill,
        priority: _priority,
        sizes: _sizes,
        ...props
    }: Record<string, unknown>) => <img alt={String(alt)} {...props} />,
}));

function makeProperty(overrides: Partial<Property> = {}): Property {
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
        isVerified: true,
        viewsCount: 12,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        ...overrides,
    };
}

describe('MyPropertyCard', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders a denser management card without a standalone details button', () => {
        render(
            <MyPropertyCard
                property={makeProperty()}
                onDelete={vi.fn()}
                onStatusChange={vi.fn()}
                layout="mobile"
            />,
        );

        expect(screen.queryByText('عرض التفاصيل')).not.toBeInTheDocument();
        expect(screen.queryByText('السعر الحالي')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'عرض تفاصيل Property 1' })).toHaveAttribute(
            'href',
            '/property/p1',
        );
        expect(screen.getByRole('link', { name: 'Property 1' })).toHaveAttribute(
            'href',
            '/property/p1',
        );
        expect(screen.getByRole('link', { name: /تعديل/ })).toHaveAttribute(
            'href',
            '/add-property?edit=p1',
        );
        expect(screen.getByRole('button', { name: /حذف/ })).toBeInTheDocument();
    });

    it('calls onDelete from the footer action without needing the old details CTA', async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();

        render(<MyPropertyCard property={makeProperty()} onDelete={onDelete} layout="grid" />);

        await user.click(screen.getByRole('button', { name: /حذف/ }));

        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onDelete).toHaveBeenCalledWith('p1');
    });
});
