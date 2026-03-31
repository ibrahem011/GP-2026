"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabaseService } from "@/services/supabaseService";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface PropertyCardProps {
    id: string;
    title: string;
    location: string;
    price: number;
    priceUnit?: string;
    image: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    rating?: number;
    isVerified?: boolean;
    isFeatured?: boolean;
    discount?: number;
}

export function PropertyCard({
    id,
    title,
    location,
    price,
    priceUnit = "ليلة",
    image,
    bedrooms,
    bathrooms,
    area,
    rating,
    isVerified = false,
    isFeatured = false,
    discount,
}: PropertyCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            checkFavoriteStatus();
        }
    }, [user, id]);

    const checkFavoriteStatus = async () => {
        if (!user) return;
        const { data } = await supabaseService.getFavorites(user.id);
        setIsFavorite(data.some((favorite) => favorite.id === id));
    };

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated || !user) {
            if (confirm("يجب تسجيل الدخول لإضافة العقارات للمفضلة. الذهاب لصفحة الدخول؟")) {
                router.push("/auth");
            }
            return;
        }

        // Optimistic update
        const newState = !isFavorite;
        setIsFavorite(newState);

        try {
            await supabaseService.toggleFavorite(user.id, id);
        } catch (error) {
            // Revert on error
            setIsFavorite(!newState);
            console.error("Error toggling favorite:", error);
        }
    };

    const imageSrc = image && image.trim() !== "" ? image : "/images/placeholder.jpg";

    return (
        <div className="group bg-surface-light dark:bg-surface-dark rounded-2xl p-3 shadow-sm border border-border-light dark:border-border-dark transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/20">
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3 group/image">
                <Link href={`/property/${id}`} className="block w-full h-full">
                    <Image
                        src={imageSrc}
                        alt={title || "Property Image"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover/image:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </Link>

                {/* Favorite Button */}
                <button
                    onClick={handleFavoriteClick}
                    className={`absolute top-3 right-3 size-8 backdrop-blur-md rounded-full flex items-center justify-center transition-all z-10 ${isFavorite
                        ? "bg-white text-error shadow-sm transform scale-110"
                        : "bg-white/30 text-white hover:bg-white hover:text-error"
                        }`}
                >
                    <span
                        className="material-symbols-outlined text-[20px] transition-colors"
                        style={{ fontVariationSettings: `'FILL' ${isFavorite ? 1 : 0}` }}
                    >
                        favorite
                    </span>
                </button>

                {/* Verified Badge */}
                {isVerified && (
                    <div className="absolute bottom-3 right-3 bg-success/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1 font-medium pointer-events-none">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        موثوق
                    </div>
                )}

                {/* Rating Badge */}
                {rating && (
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 pointer-events-none">
                        <span className="material-symbols-outlined text-yellow-500 text-[16px] fill-current">
                            star
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{rating}</span>
                    </div>
                )}

                {/* Discount Badge */}
                {discount && (
                    <div className="absolute bottom-3 left-3 bg-primary text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg pointer-events-none">
                        -{discount}% خصم
                    </div>
                )}
            </div>

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
                            {price.toLocaleString("ar-EG")} <span className="text-xs">ج.م</span>
                        </span>
                        <span className="text-xs text-text-muted">في {priceUnit}</span>
                    </div>
                </div>

                {/* Features */}
                <div className="flex gap-4 mt-4 py-3 border-t border-dashed border-border-light dark:border-border-dark">
                    {bedrooms && (
                        <div className="flex items-center gap-1.5 text-text-muted">
                            <span className="material-symbols-outlined text-[18px]">bed</span>
                            <span className="text-xs font-medium">{bedrooms} غرف</span>
                        </div>
                    )}
                    {bathrooms && (
                        <div className="flex items-center gap-1.5 text-text-muted">
                            <span className="material-symbols-outlined text-[18px]">
                                bathtub
                            </span>
                            <span className="text-xs font-medium">{bathrooms} حمام</span>
                        </div>
                    )}
                    {area && (
                        <div className="flex items-center gap-1.5 text-text-muted">
                            <span className="material-symbols-outlined text-[18px]">
                                straighten
                            </span>
                            <span className="text-xs font-medium">{area} م²</span>
                        </div>
                    )}
                </div>

                <Link
                    href={`/property/${id}`}
                    className="w-full mt-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    عرض التفاصيل
                    <span className="material-symbols-outlined text-[18px] rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1">
                        arrow_right_alt
                    </span>
                </Link>
            </div>
        </div>
    );
}
