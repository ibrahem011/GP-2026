'use client';

import '@/lib/leafletDefaultIcon';

import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import type { DragEndEvent, MapOptions } from 'leaflet';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { getAreaMapZone, getAreaViewport, type PropertyLocationValue } from '@/lib/propertyAreas';
import { useMediaQuery } from '@/hooks/useMediaQuery';

type LocationPickerProps = {
    value?: PropertyLocationValue | null;
    selectedArea?: string;
    locationError?: string | null;
    onLocationSelect: (location: PropertyLocationValue) => void;
    onLocationClear?: () => void;
};

type LeafletTouchOptions = MapOptions & {
    tap?: boolean;
};

function MapViewportSync({
    value,
    selectedArea,
}: {
    value?: PropertyLocationValue | null;
    selectedArea?: string;
}) {
    const map = useMap();
    const viewport = getAreaViewport(selectedArea);
    const target = value ?? viewport.center;

    useEffect(() => {
        map.setView([target.lat, target.lng], viewport.zoom, { animate: true });
    }, [map, target.lat, target.lng, viewport.zoom]);

    return null;
}

function MapClickHandler({ onSelect }: { onSelect: (location: PropertyLocationValue) => void }) {
    useMapEvents({
        click(event) {
            onSelect({
                lat: event.latlng.lat,
                lng: event.latlng.lng,
            });
        },
    });

    return null;
}

export default function LocationPicker({
    value,
    selectedArea,
    locationError,
    onLocationSelect,
    onLocationClear,
}: LocationPickerProps) {
    const isCoarsePointer = useMediaQuery('(pointer: coarse)');
    const viewport = getAreaViewport(selectedArea);
    const areaZone = getAreaMapZone(selectedArea);
    const hasSelectedPoint = value != null;

    const markerEventHandlers = useMemo(
        () => ({
            dragend(event: DragEndEvent) {
                const marker = event.target as L.Marker;
                const { lat, lng } = marker.getLatLng();

                onLocationSelect({ lat, lng });
            },
        }),
        [onLocationSelect],
    );

    const mapOptions: LeafletTouchOptions = {
        dragging: !isCoarsePointer,
        scrollWheelZoom: false,
        tap: false,
        touchZoom: isCoarsePointer ? 'center' : true,
    };

    return (
        <div className="relative z-0">
            <MapContainer
                center={[viewport.center.lat, viewport.center.lng]}
                zoom={viewport.zoom}
                className="h-[350px] w-full rounded-2xl"
                {...mapOptions}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewportSync value={value} selectedArea={selectedArea} />
                <MapClickHandler onSelect={onLocationSelect} />
                {areaZone ? (
                    <Circle
                        center={[areaZone.center.lat, areaZone.center.lng]}
                        radius={areaZone.radiusMeters}
                        pathOptions={{
                            color: locationError ? '#ef4444' : '#2563eb',
                            fillColor: locationError ? '#fca5a5' : '#60a5fa',
                            fillOpacity: 0.18,
                            weight: 2,
                            dashArray: '8 6',
                        }}
                    />
                ) : null}
                {value ? (
                    <Marker
                        draggable
                        eventHandlers={markerEventHandlers}
                        position={[value.lat, value.lng]}
                    />
                ) : null}
            </MapContainer>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-4 text-slate-950 shadow-sm dark:border-white/10 dark:from-zinc-900 dark:to-slate-950 dark:text-slate-100">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-bold md:text-base">الموقع الدقيق على الخريطة</h3>
                        <p className="mt-1 text-xs text-current/80">
                            {areaZone
                                ? `اضغط داخل نطاق ${selectedArea} أو اسحب المؤشر لتحديد مكان العقار بدقة.`
                                : 'اختر المنطقة أولاً ثم ضع نقطة العقار داخل النطاق الظاهر على الخريطة.'}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                                hasSelectedPoint
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                            }`}
                        >
                            {hasSelectedPoint ? 'تم تحديد النقطة' : 'النقطة اختيارية'}
                        </span>
                        {selectedArea ? (
                            <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-current shadow-sm dark:bg-black/20">
                                {selectedArea}
                            </span>
                        ) : null}
                    </div>
                </div>

                {locationError ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-white/80 p-3 text-xs font-medium text-red-700 shadow-sm dark:border-red-900/50 dark:bg-black/20 dark:text-red-200">
                        {locationError}
                    </div>
                ) : null}

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/80 p-3 shadow-sm dark:bg-black/20">
                        <p className="text-[11px] font-medium text-current/75">خط العرض</p>
                        <p className="mt-1 text-sm font-bold">{value ? value.lat.toFixed(6) : '--'}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-3 shadow-sm dark:bg-black/20">
                        <p className="text-[11px] font-medium text-current/75">خط الطول</p>
                        <p className="mt-1 text-sm font-bold">{value ? value.lng.toFixed(6) : '--'}</p>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-current/80">
                    <p>{areaZone ? 'المنطقة المختارة مميزة بدائرة واضحة لتسهيل تحديد المكان.' : 'سيظهر نطاق المنطقة هنا بعد اختيارها.'}</p>
                    {value && onLocationClear ? (
                        <button
                            type="button"
                            onClick={onLocationClear}
                            className="rounded-full border border-current/15 bg-white/80 px-3 py-1.5 font-bold text-current transition hover:bg-white dark:bg-black/20 dark:hover:bg-black/30"
                        >
                            إزالة النقطة
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
