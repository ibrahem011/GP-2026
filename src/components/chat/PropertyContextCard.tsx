import Link from 'next/link';
import { PROPERTY_IMAGE_PLACEHOLDER, normalizePropertyImageSrc } from '@/lib/propertyImages';
import { Property, PRICE_UNIT_AR } from '@/types';
import type { PriceUnit } from '@/types/database.types';

interface PropertyContextCardProps {
    property: any; // Using any temporarily if Property type mismatch, ideally Property
}

export const PropertyContextCard = ({ property }: PropertyContextCardProps) => {
    if (!property) return null;

    const propertyImageSrc = normalizePropertyImageSrc(property.images?.[0]);

    return (
        <div className="bg-white dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700 py-2 px-4 shadow-sm z-10">
            <Link href={`/property/${property.id}`} className="flex items-center gap-3 group">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-700">
                    <img
                        src={propertyImageSrc}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(event) => {
                            if (event.currentTarget.dataset.fallbackApplied === 'true') {
                                return;
                            }
                            event.currentTarget.dataset.fallbackApplied = 'true';
                            event.currentTarget.src = PROPERTY_IMAGE_PLACEHOLDER;
                        }}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight mb-0.5 group-hover:text-primary transition-colors">
                        {property.title}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                        <span className="truncate flex items-center gap-0.5">
                            <span aria-hidden="true" className="material-symbols-outlined text-[14px]">location_on</span>
                            {property.area || property.address || 'جمصة'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-primary font-bold">
                            {property.price} ج.م / {PRICE_UNIT_AR[(property.price_unit || property.priceUnit || 'day') as PriceUnit]}
                        </span>
                    </div>
                </div>

                <div className="shrink-0">
                    <span aria-hidden="true" className="material-symbols-outlined text-gray-400 group-hover:text-primary rtl:rotate-180 transition-colors">
                        chevron_left
                    </span>
                </div>
            </Link>
        </div>
    );
};
