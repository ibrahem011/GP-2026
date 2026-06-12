'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { Property } from '@/types';

const PropertyMap = dynamic(() => import('./PropertyMap'), {
    ssr: false,
    loading: () => (
        <div className="flex h-full min-h-[400px] w-full items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <div className="flex flex-col items-center text-gray-400">
                <span aria-hidden="true" className="material-symbols-outlined mb-2 text-4xl">map</span>
                <span className="text-sm">جارٍ تحميل الخريطة...</span>
            </div>
        </div>
    ),
});

interface MapViewProps {
    properties: Property[];
    className?: string;
}

type PropertyWithCoordinates = Property & {
    location: Property['location'] & {
        lat: number;
        lng: number;
    };
};

function hasCoordinates(property: Property): property is PropertyWithCoordinates {
    return typeof property.location?.lat === 'number' && typeof property.location?.lng === 'number';
}

export default function MapView({ properties, className = '' }: MapViewProps) {
    const mappableProperties = useMemo(() => properties.filter(hasCoordinates), [properties]);

    const center = useMemo(() => {
        if (mappableProperties.length === 0) return undefined;

        const lat =
            mappableProperties.reduce((sum, property) => sum + property.location.lat, 0) / mappableProperties.length;
        const lng =
            mappableProperties.reduce((sum, property) => sum + property.location.lng, 0) / mappableProperties.length;

        return [lat, lng] as [number, number];
    }, [mappableProperties]);

    if (mappableProperties.length === 0) {
        return (
            <div
                className={`flex h-[600px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center shadow-xl dark:border-gray-700 dark:bg-gray-900 ${className}`}
            >
                <span aria-hidden="true" className="material-symbols-outlined text-5xl text-gray-400">location_off</span>
                <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">لا توجد مواقع دقيقة لعرضها الآن</h3>
                <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                    بعض العقارات لا تحتوي على إحداثيات محفوظة بعد، لذلك ستظهر في القائمة فقط حتى يتم تحديد موقعها.
                </p>
            </div>
        );
    }

    return (
        <div
            className={`relative z-0 h-[600px] w-full overflow-hidden rounded-2xl border border-gray-200 shadow-xl dark:border-gray-800 ${className}`}
        >
            <PropertyMap properties={mappableProperties} center={center} />
        </div>
    );
}
