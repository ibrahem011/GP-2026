'use client';

import '@/lib/leafletDefaultIcon';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import Link from 'next/link';
import Image from 'next/image';
import { normalizePropertyImageSrc } from '@/lib/propertyImages';
import { PRICE_UNIT_AR, type Property } from '@/types';

interface PropertyMapProps {
    properties: Property[];
    center?: [number, number];
    zoom?: number;
}

const DEFAULT_CENTER: [number, number] = [31.4456, 31.5477];

export default function PropertyMap({ properties, center = DEFAULT_CENTER, zoom = 14 }: PropertyMapProps) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom
            className="h-full w-full rounded-2xl z-0"
            style={{ minHeight: '400px' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {properties.map((property) => (
                <Marker
                    key={property.id}
                    position={[property.location.lat as number, property.location.lng as number]}
                >
                    <Popup className="glass-popup">
                        <div className="w-48 p-1">
                            <div className="relative mb-2 h-24 w-full overflow-hidden rounded-lg">
                                {/*
                                 * Protect next/image from raw storage paths while data is being
                                 * normalized or when signing is unavailable.
                                 */}
                                <Image
                                    src={normalizePropertyImageSrc(property.images[0])}
                                    alt={property.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <h3 className="mb-1 line-clamp-1 text-sm font-bold">{property.title}</h3>
                            <p className="mb-2 text-xs font-bold text-primary">
                                {property.price.toLocaleString('ar-EG')} ج.م / {PRICE_UNIT_AR[property.priceUnit]}
                            </p>
                            <p className="mb-2 line-clamp-1 text-[11px] text-gray-500">{property.location.address}</p>
                            <Link
                                href={`/property/${property.id}`}
                                className="block w-full rounded-md bg-primary py-1.5 text-center text-xs text-white transition-colors hover:bg-primary/90"
                            >
                                عرض التفاصيل
                            </Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
