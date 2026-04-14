'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PROPERTY_IMAGE_PLACEHOLDER, normalizePropertyImageSrc } from '@/lib/propertyImages';
import { supabase } from '@/lib/supabase';
import { supabaseService } from '@/services/supabaseService';

interface PropertyContextHeaderProps {
    conversationId: string;
    propertyId: string;
    ownerId: string;
    currentUserId: string;
}

export function PropertyContextHeader({
    conversationId,
    propertyId,
    ownerId,
    currentUserId
}: PropertyContextHeaderProps) {
    const [property, setProperty] = useState<any>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // جلب بيانات العقار
    useEffect(() => {
        async function fetchProperty() {
            const convDetails = await supabaseService.getConversationDetails(conversationId);
            if (convDetails?.property) {
                setProperty({
                    id: convDetails.property.id,
                    title: convDetails.property.title,
                    price_per_night: convDetails.property.price,
                    location: convDetails.property.area || convDetails.property.address,
                    images: convDetails.property.images,
                    owner_phone: convDetails.property.owner_phone
                });
            }
        }
        fetchProperty();
    }, [conversationId]);

    // تتبع حالة الاتصال (Online Status) with Supabase Presence
    useEffect(() => {
        if (!conversationId || !currentUserId || !ownerId) return;

        const channel = supabase
            .channel(`presence:${conversationId}`)
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const ownerPresent = Object.values(state).some(
                    (presences: any) => presences.some((p: any) => p.user_id === ownerId)
                );
                setIsOnline(ownerPresent);
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                const joined = newPresences.some((p: any) => p.user_id === ownerId);
                if (joined) setIsOnline(true);
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                const left = leftPresences.some((p: any) => p.user_id === ownerId);
                if (left) setIsOnline(false);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: currentUserId,
                        online_at: new Date().toISOString()
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [conversationId, ownerId, currentUserId]);

    // تتبع مؤشر الكتابة (Typing Indicator) with Supabase Broadcast
    useEffect(() => {
        if (!conversationId || !ownerId) return;

        const channel = supabase
            .channel(`typing:${conversationId}`)
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.user_id === ownerId) {
                    setIsTyping(true);
                    // Hide typing indicator after 3 seconds
                    setTimeout(() => setIsTyping(false), 3000);
                }
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [conversationId, ownerId]);

    if (!property) return (
        <div className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5">
            <div className="max-w-2xl mx-auto px-4 py-3">
                <div className="h-14 bg-gray-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
            </div>
        </div>
    );

    const propertyImageSrc = normalizePropertyImageSrc(property.images?.[0]);

    return (
        <div className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 shadow-sm">
            <div className="max-w-2xl mx-auto px-4 py-3">
                <div className="flex items-center gap-3">

                    {/* زر الرجوع */}
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-500"
                    >
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>

                    {/* صورة العقار */}
                    <Link
                        href={`/property/${property.id}`}
                        className="relative group shrink-0"
                    >
                        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-100 dark:border-zinc-800 group-hover:border-blue-500 transition-colors">
                            <img
                                src={propertyImageSrc}
                                alt={property.title}
                                className="w-full h-full object-cover группhover:scale-110 transition-transform duration-300"
                                onError={(event) => {
                                    if (event.currentTarget.dataset.fallbackApplied === 'true') {
                                        return;
                                    }
                                    event.currentTarget.dataset.fallbackApplied = 'true';
                                    event.currentTarget.src = PROPERTY_IMAGE_PLACEHOLDER;
                                }}
                            />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white text-xs">arrow_outward</span>
                        </div>
                    </Link>

                    {/* تفاصيل العقار */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {property.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {property.price_per_night} ج.م/ليلة
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[12px]">location_on</span>
                                {property.location}
                            </span>
                        </div>

                        {/* مؤشر الحالة */}
                        <div className="flex items-center gap-1.5 mt-1">
                            {isTyping ? (
                                <div className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400">
                                    <div className="flex gap-0.5">
                                        <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span>جاري الكتابة...</span>
                                </div>
                            ) : isOnline ? (
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span>متصل الآن</span>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400">غير متصل</span>
                            )}
                        </div>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex gap-2 shrink-0">


                        {/* زر الخيارات */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isMenuOpen ? 'bg-gray-200 dark:bg-zinc-700' : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                            >
                                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">more_vert</span>
                            </button>

                            {/* القائمة المنسدلة */}
                            {isMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden z-[60] origin-top-left animate-in fade-in zoom-in-95 duration-200">
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                // TODO: Implement report functionality
                                                alert('سيتم تنفيذ الإبلاغ قريباً');
                                            }}
                                            className="w-full px-4 py-2.5 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">flag</span>
                                            <span>إبلاغ عن عقار</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                // TODO: Implement block functionality
                                                alert('سيتم تنفيذ الحظر قريباً');
                                            }}
                                            className="w-full px-4 py-2.5 text-right text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">block</span>
                                            <span>حظر المستخدم</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
