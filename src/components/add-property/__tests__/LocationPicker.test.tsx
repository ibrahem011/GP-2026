import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AREAS } from '@/types';
import { AREA_MAP_ZONES } from '@/lib/propertyAreas';

const mockSetView = vi.fn();

vi.mock('@/lib/leafletDefaultIcon', () => ({}));
vi.mock('@/hooks/useMediaQuery', () => ({
    useMediaQuery: () => false,
}));
vi.mock('leaflet', () => ({
    default: {
        Marker: class MockMarker {},
    },
}));
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children, center, zoom }: any) => (
        <div data-testid="map-container" data-center={center.join(',')} data-zoom={String(zoom)}>
            {children}
        </div>
    ),
    TileLayer: () => <div data-testid="tile-layer" />,
    Circle: ({ center, radius }: any) => (
        <div data-testid="area-circle" data-center={center.join(',')} data-radius={String(radius)} />
    ),
    Marker: ({ position }: any) => <div data-testid="marker" data-position={position.join(',')} />,
    useMap: () => ({
        setView: mockSetView,
    }),
    useMapEvents: () => null,
}));

import LocationPicker from '../LocationPicker';

describe('LocationPicker', () => {
    it('recenters to the selected area and renders its circle', async () => {
        const area = AREAS[0];
        const zone = AREA_MAP_ZONES[area];

        render(
            <LocationPicker
                selectedArea={area}
                value={null}
                onLocationSelect={vi.fn()}
            />,
        );

        expect(screen.getByTestId('area-circle')).toHaveAttribute(
            'data-radius',
            String(zone.radiusMeters),
        );

        await waitFor(() => {
            expect(mockSetView).toHaveBeenCalledWith(
                [zone.center.lat, zone.center.lng],
                zone.zoom,
                { animate: true },
            );
        });
    });

    it('shows location errors and renders the marker when a point exists', () => {
        render(
            <LocationPicker
                selectedArea={AREAS[0]}
                value={{ lat: 31.44, lng: 31.53 }}
                locationError="النقطة خارج النطاق."
                onLocationSelect={vi.fn()}
                onLocationClear={vi.fn()}
            />,
        );

        expect(screen.getByText('النقطة خارج النطاق.')).toBeInTheDocument();
        expect(screen.getByTestId('marker')).toHaveAttribute('data-position', '31.44,31.53');
        expect(screen.getByRole('button', { name: 'إزالة النقطة' })).toBeInTheDocument();
    });
});
