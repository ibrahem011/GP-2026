'use client';

import { useEffect, useState } from 'react';

interface WhatsAppButtonProps {
    phone: string;
    propertyTitle: string;
    className?: string;
    variant?: 'floating' | 'static';
}

export default function WhatsAppButton({
    phone,
    propertyTitle,
    className = "",
    variant = 'static'
}: WhatsAppButtonProps) {
    const [pageUrl, setPageUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPageUrl(window.location.href);
        }
    }, []);

    const handleClick = () => {
        // Remove non-numeric characters from phone and ensure it starts with country code (assuming Egypt +20 if not present)
        let cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('20') && cleanPhone.startsWith('01')) {
            cleanPhone = '20' + cleanPhone.substring(1);
        }

        const message = encodeURIComponent(
            `مرحباً، أستفسر عن العقار: ${propertyTitle}\nالرابط: ${pageUrl}`
        );

        const url = `https://wa.me/${cleanPhone}?text=${message}`;
        window.open(url, '_blank');
    };

    if (variant === 'floating') {
        return (
            <button
                onClick={handleClick}
                className={`fixed bottom-6 left-6 z-50 bg-primary hover:brightness-110 text-white p-4 rounded-full shadow-2xl transition-transform active:scale-95 animate-bounce-subtle flex items-center justify-center ${className}`}
                aria-label="تواصل عبر واتساب"
            >
                <span aria-hidden="true" className="material-symbols-outlined text-[28px]">chat</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className={`bg-primary hover:brightness-110 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 ${className}`}
        >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">chat</span>
            <span>تواصل واتساب</span>
        </button>
    );
}
