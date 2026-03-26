import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Property, CATEGORY_AR, STATUS_AR, PropertyStatus } from '@/types';

interface MyPropertyCardProps {
    property: Property;
    onDelete: (id: string) => void;
    onStatusChange?: (id: string, status: PropertyStatus) => void;
    isDeleting?: boolean;
}

function MyPropertyCardComponent({ property, onDelete, onStatusChange, isDeleting }: MyPropertyCardProps) {
    const [showStatusMenu, setShowStatusMenu] = useState(false);
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

    const handleStatusChange = (status: PropertyStatus) => {
        if (onStatusChange && property.status !== status) {
            onStatusChange(property.id, status);
        }
        setShowStatusMenu(false);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onDelete(property.id);
    };

    return (
        <div className="group bg-white dark:bg-zinc-900/50 backdrop-blur-md rounded-[1.5rem] p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row gap-5">
            {/* Image */}
            <div className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0 rounded-[1.1rem] overflow-hidden bg-gray-100 dark:bg-zinc-800">
                <Image
                    src={property.images[0] || '/placeholder-house.jpg'}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, 192px"
                />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                    {CATEGORY_AR[property.category]}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                    <div className="flex items-start justify-between mb-3">
                        <Link href={`/property/${property.id}`} className="font-black text-lg text-gray-900 dark:text-white line-clamp-1 hover:text-primary transition-colors">
                            {property.title}
                        </Link>
                        <div className="relative z-10" ref={menuRef}>
                            <button
                                onClick={() => setShowStatusMenu(!showStatusMenu)}
                                disabled={!onStatusChange}
                                aria-label="تغيير حالة العقار"
                                aria-expanded={showStatusMenu}
                                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm ${property.status === 'available'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/20'
                                        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                                    }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${property.status === 'available' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                {STATUS_AR[property.status]}
                                {onStatusChange && <span className="material-symbols-outlined text-[14px]" aria-hidden="true">expand_more</span>}
                            </button>
                            {showStatusMenu && onStatusChange && (
                                <div className="absolute top-full left-0 mt-2 bg-white/90 dark:bg-zinc-800/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 border border-gray-100 dark:border-white/10 p-1 z-20 min-w-[140px] animate-in slide-in-from-top-2 fade-in zoom-in-95 duration-200">
                                    {(Object.keys(STATUS_AR) as PropertyStatus[]).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(status)}
                                            className="w-full text-right px-4 py-2.5 text-sm font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-between group/btn"
                                        >
                                            {STATUS_AR[status]}
                                            {property.status === status && <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">check</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] opacity-70" aria-hidden="true">location_on</span>
                        {property.location.area}
                    </div>

                    <div className="flex items-center gap-5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">visibility</span>
                            {property.viewsCount} مشاهدة
                        </span>
                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">calendar_today</span>
                            {new Date(property.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4 mt-4 gap-4">
                    <span className="font-black text-xl text-primary">
                        {property.price} <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">ج.م / {property.priceUnit}</span>
                    </span>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                            aria-label="حذف العقار"
                            className="flex-1 sm:flex-none flex items-center justify-center p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group/del"
                            title="حذف العقار"
                        >
                            {isDeleting ? (
                                <span className="material-symbols-outlined text-[22px] animate-spin" aria-hidden="true">hourglass_empty</span>
                            ) : (
                                <span className="material-symbols-outlined text-[22px] group-hover/del:scale-110 transition-transform" aria-hidden="true">delete</span>
                            )}
                        </button>
                        <Link
                            href={`/add-property?edit=${property.id}`}
                            aria-label="تعديل العقار"
                            className="flex-1 sm:flex-none flex items-center justify-center p-2.5 rounded-xl text-gray-600 dark:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 transition-colors group/edit"
                            title="تعديل العقار"
                        >
                            <span className="material-symbols-outlined text-[22px] group-hover/edit:scale-110 transition-transform" aria-hidden="true">edit</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(MyPropertyCardComponent);
