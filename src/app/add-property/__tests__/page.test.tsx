import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { AREAS } from '@/types';
import { AREA_MAP_ZONES } from '@/lib/propertyAreas';

const {
    mockCreateFullProperty,
    mockAddNotification,
    mockUseAuth,
    mockProtectedRoute,
} = vi.hoisted(() => ({
    mockCreateFullProperty: vi.fn(),
    mockAddNotification: vi.fn(),
    mockUseAuth: vi.fn(),
    mockProtectedRoute: vi.fn(({ children }: { children: ReactNode }) => <>{children}</>),
}));

function MockLocationPicker(props: any) {
    const area = props.selectedArea && props.selectedArea in AREA_MAP_ZONES ? props.selectedArea : AREAS[0];
    const zone = AREA_MAP_ZONES[area as keyof typeof AREA_MAP_ZONES];

    return (
        <div data-testid="mock-location-picker">
            <div data-testid="selected-area">{props.selectedArea || 'none'}</div>
            <div data-testid="location-state">{props.value ? 'selected' : 'none'}</div>
            {props.locationError ? <p>{props.locationError}</p> : null}
            <button type="button" onClick={() => props.onLocationSelect(zone.center)}>
                inside-location
            </button>
            <button type="button" onClick={() => props.onLocationClear?.()}>
                clear-location
            </button>
        </div>
    );
}

vi.mock('next/dynamic', () => ({
    default: () => MockLocationPicker,
}));

vi.mock('next/image', () => ({
    default: ({ fill: _fill, alt, ...props }: any) => <img {...props} alt={alt || ''} />,
}));

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/ProtectedRoute', () => ({
    default: (props: { children: ReactNode }) => mockProtectedRoute(props),
}));

vi.mock('@/lib/storage', () => ({
    addNotification: mockAddNotification,
    getCurrentUser: vi.fn(() => null),
}));

vi.mock('@/services/supabaseService', () => ({
    supabaseService: {
        createFullProperty: mockCreateFullProperty,
    },
}));

vi.mock('@/components/add-property/OwnerDetailsStep', () => ({
    default: ({ value, onChange }: any) => (
        <input
            aria-label="owner-name"
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    ),
}));

import AddPropertyPage from '../page';

function getFieldByLabelText(labelText: RegExp, selector = 'input, textarea, select') {
    const [label] = screen.getAllByText(labelText, { selector: 'label' });
    const container = label.parentElement;
    const field = container?.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;

    if (!field) {
        throw new Error(`Field not found for label ${String(labelText)}`);
    }

    return field;
}

async function uploadImage(container: HTMLElement) {
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    if (!fileInput) {
        throw new Error('Image input not found');
    }

    const file = new File(['image-bytes'], 'property.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
}

async function advanceToStep2(user: ReturnType<typeof userEvent.setup>, container: HTMLElement) {
    await uploadImage(container);
    await user.type(getFieldByLabelText(/عنوان العقار/u), 'شقة مطلة');
    await user.clear(getFieldByLabelText(/السعر/u));
    await user.type(getFieldByLabelText(/السعر/u), '1500');
    await user.click(screen.getByRole('button', { name: /التالي/u }));
}

async function advanceToStep3(user: ReturnType<typeof userEvent.setup>, container: HTMLElement) {
    await advanceToStep2(user, container);
    await user.type(getFieldByLabelText(/وصف العقار/u, 'textarea'), 'وصف واضح ومختصر للعقار.');
    await user.click(screen.getByRole('button', { name: /التالي/u }));
}

async function advanceToStep4(user: ReturnType<typeof userEvent.setup>, container: HTMLElement) {
    await advanceToStep3(user, container);
    await user.selectOptions(getFieldByLabelText(/المنطقة/u, 'select'), AREAS[0]);
    await user.type(getFieldByLabelText(/العنوان التفصيلي/u), 'شارع البحر');
    await user.click(screen.getByRole('button', { name: 'inside-location' }));
    await user.click(screen.getByRole('button', { name: /التالي/u }));
    await user.clear(screen.getByLabelText('owner-name'));
    await user.type(screen.getByLabelText('owner-name'), 'مالك مختبر');
    await user.clear(getFieldByLabelText(/رقم الهاتف/u));
    await user.type(getFieldByLabelText(/رقم الهاتف/u), '+20 1012345678');
}

describe('AddPropertyPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCreateFullProperty.mockResolvedValue({ id: 'property-1' });
        mockAddNotification.mockResolvedValue(undefined);
        mockUseAuth.mockReturnValue({
            user: {
                id: 'owner-1',
                name: 'مالك مختبر',
                phone: '+20 1012345678',
                isVerified: true,
            },
        });
    });

    it('wraps the page in ProtectedRoute', () => {
        render(<AddPropertyPage />);

        expect(mockProtectedRoute).toHaveBeenCalled();
    });

    it('prevents leaving step 1 before adding an image', async () => {
        const user = userEvent.setup();

        render(<AddPropertyPage />);

        await user.type(getFieldByLabelText(/عنوان العقار/u), 'شقة مطلة');
        await user.clear(getFieldByLabelText(/السعر/u));
        await user.type(getFieldByLabelText(/السعر/u), '1500');
        await user.click(screen.getByRole('button', { name: /التالي/u }));

        expect(await screen.findByText(/صورة واحدة على الأقل/u)).toBeInTheDocument();
        expect(screen.queryByText(/تفاصيل العقار/u)).not.toBeInTheDocument();
    });

    it('clears validation errors as soon as the field is edited', async () => {
        const user = userEvent.setup();
        const { container } = render(<AddPropertyPage />);

        await uploadImage(container);
        await user.type(getFieldByLabelText(/عنوان العقار/u), 'شقة مطلة');
        await user.type(getFieldByLabelText(/السعر/u), '0');
        await user.click(screen.getByRole('button', { name: /التالي/u }));

        expect(await screen.findByText(/السعر يجب أن يكون رقم/u)).toBeInTheDocument();

        await user.clear(getFieldByLabelText(/السعر/u));
        await user.type(getFieldByLabelText(/السعر/u), '1500');

        await waitFor(() => {
            expect(screen.queryByText(/السعر يجب أن يكون رقم/u)).not.toBeInTheDocument();
        });
    });

    it('keeps the selected price unit when moving between steps', async () => {
        const user = userEvent.setup();
        const { container } = render(<AddPropertyPage />);

        await uploadImage(container);
        await user.type(getFieldByLabelText(/عنوان العقار/u), 'شقة مطلة');
        await user.clear(getFieldByLabelText(/السعر/u));
        await user.type(getFieldByLabelText(/السعر/u), '1500');

        const unitSelect = getFieldByLabelText(/لكل/u, 'select');
        await user.selectOptions(unitSelect, 'month');

        await user.click(screen.getByRole('button', { name: /التالي/u }));
        expect(await screen.findByText(/تفاصيل العقار/u)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /السابق/u }));

        expect(getFieldByLabelText(/لكل/u, 'select')).toHaveValue('month');
        expect(container).toBeTruthy();
    });

    it('shows submit stage text and a persistent submit error when publishing fails', async () => {
        const user = userEvent.setup();
        const { container } = render(<AddPropertyPage />);
        let rejectSubmit: any = null;

        mockCreateFullProperty.mockImplementation(
            (_payload: unknown, _files: File[], _userId: string, options?: { onStageChange?: (stage: 'preparing' | 'uploading' | 'saving') => void }) =>
                new Promise((_, reject) => {
                    rejectSubmit = reject;
                    options?.onStageChange?.('uploading');
                }),
        );

        await advanceToStep4(user, container);
        await user.click(screen.getByRole('button', { name: /نشر العقار/u }));

        await waitFor(() => {
            expect(mockCreateFullProperty).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /رفع الصور/u })).toBeDisabled();
        });

        rejectSubmit?.(Object.assign(new Error('UPLOAD_FAILED'), { code: 'UPLOAD_FAILED' }));

        expect(await screen.findByText(/فشل رفع الصور/u)).toBeInTheDocument();
        expect(mockAddNotification).not.toHaveBeenCalled();
    }, 10000);
});
