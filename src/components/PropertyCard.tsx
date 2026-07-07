"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import {
    getPropertyImageUrl,
    PROPERTY_IMAGE_PLACEHOLDER,
    normalizePropertyImageSrc,
} from "@/lib/propertyImages";
import { cn } from "@/lib/utils";
import {
    CATEGORY_AR,
    PRICE_UNIT_AR,
    type PriceUnit,
    type PropertyCategory,
    type PropertyStatus,
} from "@/types";

interface PropertyCardProps {
    id: string;
    title: string;
    location: string;
    price: number;
    priceUnit?: PriceUnit | string;
    image: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    rating?: number;
    isVerified?: boolean;
    isFeatured?: boolean;
    discount?: number;
    category?: PropertyCategory;
    status?: PropertyStatus;
    features?: string[];
    viewsCount?: number;
    variant?: "default" | "favorites" | "spotlight";
    initialIsFavorite?: boolean;
    onFavoriteChange?: (id: string, isFavorite: boolean) => void;
}

function formatRating(rating: number) {
    return Number.isInteger(rating) ? rating.toString() : rating.toFixed(1);
}

const AR = {
    confirmLogin:
        "\u064A\u062C\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062A \u0625\u0644\u0649 \u0627\u0644\u0645\u0641\u0636\u0644\u0629. \u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644 \u0625\u0644\u0649 \u0635\u0641\u062D\u0629 \u0627\u0644\u062F\u062E\u0648\u0644\u061F",
    rooms: "\u063A\u0631\u0641",
    bathrooms: "\u062D\u0645\u0627\u0645",
    areaUnit: "\u0645\u00B2",
    propertyImage: "\u0635\u0648\u0631\u0629 \u0627\u0644\u0639\u0642\u0627\u0631",
    viewDetails: "\u0639\u0631\u0636 \u062A\u0641\u0627\u0635\u064A\u0644",
    discount: "\u062E\u0635\u0645",
    verified: "\u0645\u0648\u062B\u0642",
    removeFavorite: "\u0625\u0632\u0627\u0644\u0629 \u0645\u0646 \u0627\u0644\u0645\u0641\u0636\u0644\u0629",
    addFavorite: "\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0641\u0636\u0644\u0629",
    startsFrom: "\u064A\u0628\u062F\u0623 \u0645\u0646",
    currency: "\u062C.\u0645",
    per: "\u0644\u0643\u0644",
};

function PropertyCardComponent({
    id,
    title,
    location,
    price,
    priceUnit = "day",
    image,
    bedrooms,
    bathrooms,
    area,
    rating,
    isVerified = false,
    discount,
    category,
    variant = "default",
    initialIsFavorite,
    onFavoriteChange,
}: PropertyCardProps) {
    const [isFavorite, setIsFavorite] = useState(Boolean(initialIsFavorite));
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
    const [imgError, setImgError] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const {
        ensureLoaded: ensureFavoritesLoaded,
        isFavorite: isFavoriteInStore,
        toggleFavorite,
    } = useFavorites();
    const router = useRouter();
    const favoriteFromStore = isFavoriteInStore(id);

    useEffect(() => {
        if (initialIsFavorite !== undefined) {
            setIsFavorite(Boolean(initialIsFavorite));
            return;
        }

        setIsFavorite(favoriteFromStore);
    }, [favoriteFromStore, initialIsFavorite]);

    useEffect(() => {
        setImgError(false);
    }, [image]);

    useEffect(() => {
        if (!user || initialIsFavorite !== undefined) {
            return;
        }

        void ensureFavoritesLoaded();
    }, [ensureFavoritesLoaded, initialIsFavorite, user]);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        // Keep favorite click independent from card-wide navigation link.
        e.preventDefault();
        e.stopPropagation();

        if (isTogglingFavorite) {
            return;
        }

        if (!isAuthenticated || !user) {
            if (confirm(AR.confirmLogin)) {
                router.push("/auth");
            }
            return;
        }

        const nextState = !isFavorite;
        setIsFavorite(nextState);
        setIsTogglingFavorite(true);

        try {
            const savedState = await toggleFavorite(id, nextState);
            setIsFavorite(savedState);
            onFavoriteChange?.(id, savedState);
        } catch (error) {
            setIsFavorite(!nextState);
            console.error("Error toggling favorite:", error);
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    const imageSrc = getPropertyImageUrl(
        imgError ? PROPERTY_IMAGE_PLACEHOLDER : normalizePropertyImageSrc(image),
    );

    const metaItems = useMemo(
        () =>
            [
                bedrooms
                    ? {
                          icon: "bed",
                          label: `${bedrooms.toLocaleString("ar-EG")} ${AR.rooms}`,
                      }
                    : null,
                bathrooms
                    ? {
                          icon: "bathtub",
                          label: `${bathrooms.toLocaleString("ar-EG")} ${AR.bathrooms}`,
                      }
                    : null,
                area
                    ? {
                          icon: "straighten",
                          label: `${area.toLocaleString("ar-EG")} ${AR.areaUnit}`,
                      }
                    : null,
            ].filter(Boolean) as Array<{ icon: string; label: string }>,
        [area, bathrooms, bedrooms],
    );

    const categoryLabel = category ? CATEGORY_AR[category] : null;
    const trimmedLocation = location.trim();
    const locationLabel = trimmedLocation || categoryLabel;
    const priceUnitLabel =
        typeof priceUnit === "string" && priceUnit in PRICE_UNIT_AR
            ? PRICE_UNIT_AR[priceUnit as PriceUnit]
            : priceUnit;
    const isSpotlight = variant === "spotlight";
    const isFavorites = variant === "favorites";
    const cardHeightClass = isSpotlight
        ? "h-[380px] sm:h-[400px] md:h-[420px]"
        : isFavorites
          ? "h-[340px] sm:h-[360px] md:h-[380px]"
          : "h-[360px] sm:h-[380px] md:h-[400px]";
    const imageSizes = isSpotlight
        ? "(max-width: 768px) 100vw, (max-width: 1440px) 50vw, 46vw"
        : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw";

    return (
        <article
            className={cn(
                "group relative h-full w-full cursor-pointer rounded-[1.5rem] border border-slate-100 bg-surface-light p-2 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-18px_rgba(15,23,42,0.22)] dark:border-white/5 dark:bg-surface-dark",
                isSpotlight &&
                    "rounded-[1.75rem] border-slate-200/80 bg-surface-light/95 p-2.5 shadow-[0_18px_44px_-20px_rgba(15,23,42,0.24)] hover:shadow-[0_24px_48px_-24px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-surface-dark/95",
            )}
        >
            <div
                className={cn(
                    "relative flex w-full flex-col overflow-hidden rounded-[1.5rem]",
                    isSpotlight && "rounded-[1.65rem]",
                    cardHeightClass,
                )}
            >
                <Image
                    src={imageSrc}
                    alt={title || AR.propertyImage}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes={imageSizes}
                    onError={() => {
                        if (imageSrc !== PROPERTY_IMAGE_PLACEHOLDER) {
                            setImgError(true);
                        }
                    }}
                />

                <div
                    className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 transition-opacity duration-500 group-hover:opacity-60",
                    )}
                />

                <Link
                    href={`/property/${id}`}
                    className="absolute inset-0 z-10 rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-surface-dark"
                    aria-label={`${AR.viewDetails} ${title}`}
                />

                <div
                    className={cn(
                        "pointer-events-none absolute z-20 flex flex-col",
                        isSpotlight ? "left-4 top-4 gap-2" : "left-3 top-3 gap-1.5",
                    )}
                >
                    {typeof discount === "number" && discount > 0 ? (
                        <span className="inline-flex items-center rounded-full border border-rose-200/60 bg-rose-500/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                            {AR.discount} {discount}%
                        </span>
                    ) : null}
                    {isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/40 bg-emerald-500/85 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            {AR.verified}
                        </span>
                    ) : null}
                </div>

                <button
                    onClick={handleFavoriteClick}
                    disabled={isTogglingFavorite}
                    aria-label={isFavorite ? AR.removeFavorite : AR.addFavorite}
                    className={cn(
                        "absolute z-20 flex items-center justify-center touch-target rounded-full bg-surface-light/92 text-rose-500 backdrop-blur-md transition-all duration-200 hover:bg-surface-light active:scale-95 disabled:cursor-wait disabled:opacity-80 focus-visible:ring-2 focus-visible:ring-primary/70",
                        isSpotlight ? "right-4 top-4 size-11 shadow-md" : "right-3 top-3 size-11 shadow-sm",
                        isFavorite && "shadow-rose-500/20",
                    )}
                >
                    <span
                        className={cn(
                            "material-symbols-outlined",
                            isSpotlight ? "text-[22px]" : "text-[20px]",
                            isTogglingFavorite && "animate-spin",
                        )}
                        style={{
                            fontVariationSettings:
                                isFavorite && !isTogglingFavorite ? "'FILL' 1" : "'FILL' 0",
                        }}
                    >
                        {isTogglingFavorite ? "progress_activity" : "favorite"}
                    </span>
                </button>

                <div
                    className={cn(
                        "pointer-events-none absolute bottom-0 left-0 z-10 flex w-full flex-col justify-end",
                        isSpotlight ? "p-3 md:p-4" : "p-2.5 sm:p-3",
                    )}
                >
                    <div
                        className={cn(
                            "relative w-full overflow-hidden transition-all duration-500",
                            isSpotlight
                                ? "rounded-[1.5rem] bg-surface-light/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-2xl dark:bg-surface-dark/90 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] dark:ring-white/10 group-hover:bg-surface-light/95 dark:group-hover:bg-surface-dark/95"
                                : "rounded-[1.25rem] bg-surface-light/90 shadow-[0_4px_20px_rgb(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur-2xl dark:bg-surface-dark/90 dark:shadow-[0_4px_20px_rgb(0,0,0,0.4)] dark:ring-white/10 group-hover:bg-surface-light/95 dark:group-hover:bg-surface-dark/95",
                        )}
                    >
                        {/* Elegant top highlight for glassmorphism */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/10" />

                        <div className={isSpotlight ? "p-4 sm:p-5" : "p-3.5 sm:p-4"}>
                            <div className="mb-1.5 flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-2.5 flex items-center justify-between">
                                        {categoryLabel ? (
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary dark:bg-primary/20 dark:text-blue-300">
                                                {categoryLabel}
                                            </span>
                                        ) : <div />}
                                        {typeof rating === "number" && rating > 0 ? (
                                            <div className="flex shrink-0 items-center justify-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 shadow-sm backdrop-blur-sm dark:bg-amber-500/20 dark:text-amber-300">
                                                <span className="mt-0.5">{formatRating(rating)}</span>
                                                <span className="material-symbols-outlined text-[13px] text-amber-500 dark:text-amber-400">star</span>
                                            </div>
                                        ) : null}
                                    </div>
                                    <h3
                                        className={cn(
                                            "font-extrabold tracking-tight text-slate-900 dark:text-white",
                                            isSpotlight ? "mb-1.5 line-clamp-2 text-xl md:text-2xl" : "mb-1 line-clamp-2 text-base sm:text-lg",
                                        )}
                                    >
                                        {title}
                                    </h3>
                                    {locationLabel ? (
                                        <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 text-[12px] sm:text-[13px]">
                                            <span className="material-symbols-outlined text-[15px] text-slate-400 dark:text-slate-400">location_on</span>
                                            <span className="truncate">{locationLabel}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <hr className={cn("border-slate-200 dark:border-white/10", isSpotlight ? "my-3.5 sm:my-4" : "my-3 sm:my-3.5")} />

                            <div className="flex items-end justify-between gap-2">
                                <div className="flex shrink flex-col">
                                    <span className="mb-0.5 text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                        {AR.startsFrom || "يبدأ من"}
                                    </span>
                                    <div className="flex items-baseline gap-1 text-primary dark:text-blue-400 whitespace-nowrap">
                                        <span className={cn("font-black tracking-tighter", isSpotlight ? "text-2xl md:text-3xl" : "text-lg sm:text-xl")}>
                                            {price.toLocaleString("ar-EG")}
                                        </span>
                                        <span className="text-xs font-extrabold">{AR.currency}</span>
                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mx-0.5">/ {priceUnitLabel}</span>
                                    </div>
                                </div>

                                {metaItems.length > 0 ? (
                                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                                        {metaItems.slice(0, 3).map((item) => (
                                            <div key={item.label} className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 px-2 py-1.5 rounded-[0.6rem] ring-1 ring-slate-200/50 dark:ring-white/5 shadow-sm backdrop-blur-md transition-colors hover:bg-white dark:hover:bg-slate-800">
                                                <span className="text-[11px] sm:text-[12px] font-bold text-slate-800 dark:text-slate-200">{item.label.split(' ')[0]}</span>
                                                <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-slate-500 dark:text-slate-400">{item.icon}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

export const PropertyCard = React.memo(PropertyCardComponent);
