"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isDisplayableUrl } from "@/lib/storagePaths";
import { cn } from "@/lib/utils";
import { supabaseService } from "@/services/supabaseService";
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
    variant?: "default" | "favorites";
    initialIsFavorite?: boolean;
    onFavoriteChange?: (isFavorite: boolean) => void;
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

export const PropertyCard = React.memo(function PropertyCard({
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
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setIsFavorite(Boolean(initialIsFavorite));
    }, [initialIsFavorite]);

    const checkFavoriteStatus = useCallback(async () => {
        if (!user) return;

        const { data } = await supabaseService.getFavorites(user.id);
        setIsFavorite((data ?? []).some((favorite) => favorite.id === id));
    }, [id, user]);

    useEffect(() => {
        if (!user || initialIsFavorite !== undefined) {
            return;
        }

        void checkFavoriteStatus();
    }, [checkFavoriteStatus, initialIsFavorite, user]);

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
            await supabaseService.toggleFavorite(user.id, id);
            onFavoriteChange?.(nextState);
        } catch (error) {
            setIsFavorite(!nextState);
            console.error("Error toggling favorite:", error);
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    const imageSrc =
        image && isDisplayableUrl(image.trim()) ? image.trim() : "/images/placeholder.jpg";

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
    const hasLocation = location.trim().length > 0;
    const priceUnitLabel =
        typeof priceUnit === "string" && priceUnit in PRICE_UNIT_AR
            ? PRICE_UNIT_AR[priceUnit as PriceUnit]
            : priceUnit;
    const cardHeightClass =
        variant === "favorites"
            ? "h-[clamp(380px,44vw,440px)]"
            : "h-[clamp(360px,42vw,420px)]";

    return (
        <article className="group relative h-full w-full cursor-pointer rounded-[2rem] border border-slate-100 bg-white p-2 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.18)] dark:border-white/5 dark:bg-zinc-900">
            <div
                className={cn(
                    "relative flex w-full flex-col overflow-hidden rounded-[1.5rem]",
                    cardHeightClass,
                )}
            >
                <Image
                    src={imageSrc}
                    alt={title || AR.propertyImage}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent mix-blend-multiply transition-opacity duration-500 group-hover:opacity-90" />

                <Link
                    href={`/property/${id}`}
                    className="absolute inset-0 z-10"
                    aria-label={`${AR.viewDetails} ${title}`}
                />

                <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5 pointer-events-none">
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
                        "absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-md backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95 disabled:cursor-wait disabled:opacity-80",
                        isFavorite && "shadow-rose-500/20",
                    )}
                >
                    <span
                        className={cn(
                            "material-symbols-outlined text-[22px]",
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

                <div className="absolute bottom-0 left-0 z-10 flex w-full flex-col justify-end p-2.5 pointer-events-none">
                    <div className="relative w-full overflow-hidden rounded-[1.25rem] border border-white/20 bg-white/15 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-colors duration-300 group-hover:bg-white/20 dark:border-white/10 dark:bg-black/15 dark:group-hover:bg-black/25">
                        <div className="p-4">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="text-right">
                                    {categoryLabel ? (
                                        <span className="mb-1 block text-[11px] font-bold text-slate-300">
                                            {categoryLabel}
                                        </span>
                                    ) : null}
                                    <h3 className="line-clamp-1 text-xl font-black text-white drop-shadow-sm">
                                        {title}
                                    </h3>
                                    {hasLocation ? (
                                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-200/95 drop-shadow-sm">
                                            <span className="material-symbols-outlined text-[14px]">
                                                location_on
                                            </span>
                                            <span className="line-clamp-1">{location}</span>
                                        </div>
                                    ) : null}
                                </div>
                                {typeof rating === "number" && rating > 0 ? (
                                    <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/20 px-2 py-1 text-sm font-bold text-white shadow-sm backdrop-blur-md">
                                        <span className="mt-0.5">{formatRating(rating)}</span>
                                        <span className="material-symbols-outlined text-[15px] text-amber-300">
                                            star
                                        </span>
                                    </div>
                                ) : null}
                            </div>

                            <div className="mb-4 flex items-end justify-between gap-3">
                                <div className="flex flex-col gap-0.5 text-right">
                                    <p className="text-[11px] font-medium text-slate-300 drop-shadow-sm">
                                        {AR.startsFrom}
                                    </p>
                                    <div className="flex items-baseline gap-1.5 text-white">
                                        <span className="text-[26px] font-black tracking-tight drop-shadow-md">
                                            {price.toLocaleString("ar-EG")}
                                        </span>
                                        <span className="text-xs font-bold text-slate-200">
                                            {AR.currency}
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold text-slate-100 shadow-sm backdrop-blur-md">
                                    {AR.per} {priceUnitLabel}
                                </div>
                            </div>

                            {metaItems.length > 0 ? (
                                <div className="flex w-full items-center justify-between gap-2">
                                    {metaItems.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 py-2 shadow-sm backdrop-blur-md transition-colors group-hover:bg-white/20 dark:bg-white/5"
                                        >
                                            <span className="whitespace-nowrap text-[11px] font-bold text-white">
                                                {item.label}
                                            </span>
                                            <span className="material-symbols-outlined text-[16px] text-white/90">
                                                {item.icon}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
});
