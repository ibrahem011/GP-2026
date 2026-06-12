import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    getPropertyImageUrl,
    PROPERTY_IMAGE_PLACEHOLDER,
    normalizePropertyImageSrc,
} from '@/lib/propertyImages';
import { cn } from '@/lib/utils';
import { Property, CATEGORY_AR, PRICE_UNIT_AR, STATUS_AR, PropertyStatus } from '@/types';

interface MyPropertyCardProps {
    property: Property;
    onDelete: (id: string) => void;
    onStatusChange?: (id: string, status: PropertyStatus) => void;
    isDeleting?: boolean;
    layout?: 'mobile' | 'grid' | 'list';
}

const statusTone: Record<PropertyStatus, string> = {
    available:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    pending:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    rented:
        'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
    rejected:
        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
};

const statusDotTone: Record<PropertyStatus, string> = {
    available: 'bg-emerald-500',
    pending: 'bg-amber-500',
    rented: 'bg-sky-500',
    rejected: 'bg-rose-500',
};

const ownerEditableStatuses: PropertyStatus[] = ['available', 'pending', 'rented'];

function MyPropertyCardComponent({
    property,
    onDelete,
    onStatusChange,
    isDeleting,
    layout = 'mobile',
}: MyPropertyCardProps) {
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [imageErrored, setImageErrored] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowStatusMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setImageErrored(false);
    }, [property.id, property.images[0]]);

    const handleStatusChange = (status: PropertyStatus) => {
        if (onStatusChange && property.status !== status) {
            onStatusChange(property.id, status);
        }
        setShowStatusMenu(false);
    };

    const handleDeleteClick = (event: React.MouseEvent) => {
        event.preventDefault();
        onDelete(property.id);
    };

    const imageSrc = getPropertyImageUrl(
        imageErrored ? PROPERTY_IMAGE_PLACEHOLDER : normalizePropertyImageSrc(property.images[0]),
    );
    const imageSizes =
        layout === 'grid'
            ? '(max-width: 768px) 100vw, (max-width: 1536px) 33vw, 25vw'
            : layout === 'list'
              ? '(max-width: 1024px) 100vw, 320px'
              : '(max-width: 768px) 100vw, 360px';
    const priceUnitLabel = PRICE_UNIT_AR[property.priceUnit] ?? property.priceUnit;
    const locationLabel = property.location.address || property.location.area;
    const createdAtLabel = new Date(property.createdAt).toLocaleDateString('ar-EG');
    const detailsHref = `/property/${property.id}`;
    const cardLayoutClasses = {
        mobile: 'flex flex-col gap-3 p-3',
        grid: 'flex h-full flex-col gap-3 p-3.5',
        list: 'flex flex-col gap-4 p-4 lg:flex-row',
    } as const;
    const imageWrapperClasses = {
        mobile: 'aspect-[16/9] w-full',
        grid: 'aspect-[16/10] w-full',
        list: 'aspect-[16/9] w-full lg:h-auto lg:w-64 lg:shrink-0 lg:aspect-[5/4]',
    } as const;
    const infoChipGridClasses = {
        mobile: 'grid grid-cols-3 gap-2',
        grid: 'grid grid-cols-3 gap-2',
        list: 'grid grid-cols-3 gap-2 sm:max-w-md',
    } as const;
    const featureChips = useMemo(
        () =>
            [
                typeof property.bedrooms === 'number'
                    ? {
                          key: 'bedrooms',
                          icon: 'bed',
                          value: property.bedrooms.toLocaleString('ar-EG'),
                          label: 'غرف',
                      }
                    : null,
                typeof property.bathrooms === 'number'
                    ? {
                          key: 'bathrooms',
                          icon: 'bathtub',
                          value: property.bathrooms.toLocaleString('ar-EG'),
                          label: 'حمامات',
                      }
                    : null,
                typeof property.floor === 'number'
                    ? {
                          key: 'floor',
                          icon: 'layers',
                          value: property.floor.toLocaleString('ar-EG'),
                          label: 'الدور',
                      }
                    : null,
            ].filter(Boolean) as Array<{
                key: string;
                icon: string;
                value: string;
                label: string;
            }>,
        [property.bathrooms, property.bedrooms, property.floor],
    );
    const infoChips = useMemo(
        () => [
            {
                key: 'views',
                icon: 'visibility',
                label: `${property.viewsCount.toLocaleString('ar-EG')} مشاهدة`,
            },
            {
                key: 'date',
                icon: 'calendar_today',
                label: createdAtLabel,
            },
            {
                key: 'area',
                icon: 'straighten',
                label: `${property.area.toLocaleString('ar-EG')} م²`,
            },
        ],
        [createdAtLabel, property.area, property.viewsCount],
    );

    return (
        <article
            data-layout={layout}
            className={cn(
                'group rounded-[1.65rem] border border-slate-200/80 bg-white/96 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_42px_-28px_rgba(15,23,42,0.42)] dark:border-white/10 dark:bg-zinc-900/92',
                cardLayoutClasses[layout],
            )}
        >
            <Link
                href={detailsHref}
                aria-label={`عرض تفاصيل ${property.title}`}
                className={cn(
                    'relative block overflow-hidden rounded-[1.25rem] bg-slate-100 dark:bg-zinc-800',
                    imageWrapperClasses[layout],
                )}
            >
                <Image
                    src={imageSrc}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes={imageSizes}
                    onError={() => {
                        if (imageSrc !== PROPERTY_IMAGE_PLACEHOLDER) {
                            setImageErrored(true);
                        }
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/5" />

                {property.isVerified ? (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald-200/40 bg-emerald-500/85 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur">
                        <span aria-hidden="true" className="material-symbols-outlined text-[14px]">verified</span>
                        موثق
                    </span>
                ) : null}
            </Link>

            <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary dark:bg-primary/20 dark:text-blue-300">
                            <span aria-hidden="true" className="material-symbols-outlined text-[14px]">home_work</span>
                            {CATEGORY_AR[property.category]}
                        </span>

                        {locationLabel ? (
                            <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-slate-100/85 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
                                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                                    location_on
                                </span>
                                <span className="truncate">{locationLabel}</span>
                            </span>
                        ) : null}
                    </div>

                    <div className="relative z-10 shrink-0" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setShowStatusMenu((current) => !current)}
                            disabled={!onStatusChange}
                            className={cn(
                                'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-bold shadow-sm transition-all active:scale-[0.98] disabled:cursor-default disabled:hover:scale-100',
                                statusTone[property.status],
                            )}
                        >
                            <span
                                className={cn(
                                    'h-2 w-2 rounded-full',
                                    statusDotTone[property.status],
                                    property.status === 'available' && 'animate-pulse',
                                )}
                            />
                            {STATUS_AR[property.status]}
                            {onStatusChange ? (
                                <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                                    expand_more
                                </span>
                            ) : null}
                        </button>

                        {showStatusMenu && onStatusChange ? (
                            <div className="absolute left-0 top-full z-20 mt-2 min-w-[170px] rounded-2xl border border-slate-200 bg-white p-1 text-slate-900 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-zinc-900 dark:text-slate-100">
                                {ownerEditableStatuses.map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => handleStatusChange(status)}
                                        className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-right text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                                    >
                                        {STATUS_AR[status]}
                                        {property.status === status ? (
                                            <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary dark:text-blue-300">
                                                check
                                            </span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>

                <Link
                    href={detailsHref}
                    className="min-h-[3.2rem] line-clamp-2 text-base font-black leading-7 text-slate-900 transition-colors hover:text-primary dark:text-white"
                >
                    {property.title}
                </Link>

                <div className={cn('text-[11px] font-medium text-slate-500 dark:text-slate-300', infoChipGridClasses[layout])}>
                    {infoChips.map((item) => (
                        <span
                            key={item.key}
                            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-slate-100/85 px-2.5 py-2 text-center dark:bg-white/[0.05]"
                        >
                            <span aria-hidden="true" className="material-symbols-outlined text-[15px] text-slate-400 dark:text-slate-300">
                                {item.icon}
                            </span>
                            <span className="truncate">{item.label}</span>
                        </span>
                    ))}
                </div>

                {featureChips.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {featureChips.map((item) => (
                            <span
                                key={item.key}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                            >
                                <span aria-hidden="true" className="material-symbols-outlined text-[15px] text-primary">
                                    {item.icon}
                                </span>
                                <span>{item.value}</span>
                                <span className="text-slate-400 dark:text-slate-300">
                                    {item.label}
                                </span>
                            </span>
                        ))}
                    </div>
                ) : null}

                <div className="mt-auto border-t border-slate-200/75 pt-3 dark:border-white/10">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="min-w-0 text-primary dark:text-blue-300">
                            <div className="flex flex-wrap items-baseline gap-1.5">
                                <span className="text-xl font-black tracking-tight">
                                    {property.price.toLocaleString('ar-EG')}
                                </span>
                                <span className="text-sm font-bold">ج.م</span>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                                    / {priceUnitLabel}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleDeleteClick}
                                disabled={isDeleting}
                                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/20 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10"
                                title="حذف العقار"
                            >
                                {isDeleting ? (
                                    <span aria-hidden="true" className="material-symbols-outlined animate-spin text-[18px]">
                                        progress_activity
                                    </span>
                                ) : (
                                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">delete</span>
                                )}
                                <span>حذف</span>
                            </button>

                            <Link
                                href={`/add-property?edit=${property.id}`}
                                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
                                title="تعديل العقار"
                            >
                                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">edit</span>
                                <span>تعديل</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default React.memo(MyPropertyCardComponent);
