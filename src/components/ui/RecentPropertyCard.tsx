import Link from "next/link";
import Image from "next/image";
import { getPropertyImageUrl, normalizePropertyImageSrc } from "@/lib/propertyImages";

/**
 * Card component for displaying recent property listings in a vertical list.
 * Includes image, basic details, price, features, and action button.
 * 
 * @param {string} id - Property ID
 * @param {string} title - Property title
 * @param {string} location - Property location string
 * @param {number} price - Price per night
 * @param {string} image - URL/Path to the property image
 * @param {number} bedrooms - Number of bedrooms
 * @param {number} bathrooms - Number of bathrooms
 * @param {number} area - Area in square meters
 * @param {boolean} isVerified - Whether the property is verified
 * @param {number} [rating] - Optional rating
 * @param {function} [onFavoriteClick] - Callback for favorite heart button
 */
interface RecentPropertyCardProps {
    id: string;
    title: string;
    location: string;
    price: number;
    image: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    isVerified: boolean;
    rating?: number;
    onFavoriteClick?: () => void;
}

export function RecentPropertyCard({
    id,
    title,
    location,
    price,
    image,
    bedrooms,
    bathrooms,
    area,
    isVerified,
    onFavoriteClick,
}: RecentPropertyCardProps) {
    const imageSrc = getPropertyImageUrl(normalizePropertyImageSrc(image));

    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-3 shadow-sm border border-border-light dark:border-border-dark hover:shadow-md transition-shadow">
            {/* Image Container */}
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3 group">
                <Image
                    src={imageSrc}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Favorite Button - TOP RIGHT */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onFavoriteClick?.();
                    }}
                    className="absolute top-3 right-3 size-8 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-colors group/btn focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary"
                    aria-label="إضافة للمفضلة"
                    title="إضافة للمفضلة"
                >
                    <span className="material-symbols-outlined text-white group-hover/btn:text-error text-[20px] transition-colors" aria-hidden="true">
                        favorite
                    </span>
                </button>

                {/* Verified Badge - BOTTOM RIGHT */}
                {isVerified && (
                    <div className="absolute bottom-3 right-3 bg-success/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">
                            verified
                        </span>
                        موثوق
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-text-main line-clamp-1">
                            {title}
                        </h3>
                        <p className="text-sm text-text-muted flex items-center mt-1">
                            <span className="material-symbols-outlined text-[16px] text-primary ml-1">
                                location_on
                            </span>
                            {location}
                        </p>
                    </div>

                    <div className="text-left shrink-0">
                        <span className="block text-primary font-bold text-xl">
                            {price.toLocaleString("ar-EG")} ج.م
                        </span>
                        <span className="text-xs text-text-muted">في الليلة</span>
                    </div>
                </div>

                {/* Features - Dashed Border */}
                <div className="flex gap-4 mt-4 py-3 border-t border-dashed border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-1.5 text-text-muted">
                        <span className="material-symbols-outlined text-[18px]">bed</span>
                        <span className="text-xs font-medium">{bedrooms} غرف</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted">
                        <span className="material-symbols-outlined text-[18px]">
                            bathtub
                        </span>
                        <span className="text-xs font-medium">{bathrooms} حمام</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted">
                        <span className="material-symbols-outlined text-[18px]">
                            straighten
                        </span>
                        <span className="text-xs font-medium">{area} م²</span>
                    </div>
                </div>

                {/* CTA Button */}
                <Link
                    href={`/property/${id}`}
                    className="w-full mt-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    احجز الآن
                    <span className="material-symbols-outlined text-[18px] rtl:rotate-180">
                        arrow_right_alt
                    </span>
                </Link>
            </div>
        </div>
    );
}
