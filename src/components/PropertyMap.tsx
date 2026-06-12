'use client';

import '@/lib/leafletDefaultIcon';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import Link from 'next/link';
import Image from 'next/image';
import { getPropertyImageUrl, normalizePropertyImageSrc } from '@/lib/propertyImages';
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
                    <Popup className="premium-map-popup">
                        <div className="w-[230px] p-1 text-right" dir="rtl">
                            <div className="relative mb-3 h-32 w-full overflow-hidden rounded-xl">
                                {/*
                                 * Protect next/image from raw storage paths while data is being
                                 * normalized or when signing is unavailable.
                                 */}
                                <Image
                                    src={getPropertyImageUrl(normalizePropertyImageSrc(property.images[0]))}
                                    alt={property.title}
                                    fill
                                    className="object-cover transition-transform duration-500 hover:scale-110"
                                />
                                <div className="absolute top-2 right-2 rounded-full bg-surface-light/90 px-2.5 py-1 text-xs font-bold text-primary backdrop-blur-md dark:bg-slate-900/90 dark:text-blue-300 shadow-sm">
                                    {property.category === 'apartment' ? 'شقة' : property.category === 'villa' ? 'فيلا' : property.category === 'chalet' ? 'شاليه' : 'عقار'}
                                </div>
                            </div>
                            
                            <h3 className="mb-1.5 line-clamp-1 text-base font-bold text-slate-900 dark:text-white leading-tight">{property.title}</h3>
                            <p className="mb-3 line-clamp-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-start gap-1">
                                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">location_on</span>
                                {property.location.address || property.location.area}
                            </p>
                            
                            <div className="mb-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">السعر:</span>
                                    <span className="text-lg font-black text-primary dark:text-blue-400">
                                        {property.price.toLocaleString('ar-EG')} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ج.م / {PRICE_UNIT_AR[property.priceUnit]}</span>
                                    </span>
                                </div>
                            </div>
                            
                            <Link
                                href={`/property/${property.id}`}
                                className="block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-bold !text-white transition-colors hover:bg-primary/90 shadow-md mt-1"
                            >
                                التفاصيل
                            </Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
