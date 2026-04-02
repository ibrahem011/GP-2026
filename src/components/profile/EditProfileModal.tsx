'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabaseService } from '@/services/supabaseService';

export default function EditProfileModal({
    isOpen,
    onClose,
    onUpdated,
}: {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: (payload: { name: string; phone: string }) => void;
}) {
    const { user } = useAuth() as unknown as {
        user: { id: string; name?: string; full_name?: string; phone?: string } | null;
    };

    const dialogRef = useRef<HTMLDivElement | null>(null);
    const firstFieldRef = useRef<HTMLInputElement | null>(null);

    const initialName = useMemo(() => (user?.name ?? (user as any)?.full_name ?? '').trim(), [user]);
    const initialPhone = useMemo(() => (user?.phone ?? '').trim(), [user]);

    const [name, setName] = useState(initialName);
    const [phone, setPhone] = useState(initialPhone);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Reset fields when opening
    useEffect(() => {
        if (!isOpen) return;
        setName(initialName);
        setPhone(initialPhone);
        setSuccess(false);
        setErrorMsg(null);
    }, [isOpen, initialName, initialPhone]);

    // Focus + scroll lock + keyboard handling (+ simple focus trap)
    useEffect(() => {
        if (!isOpen) return;

        const previousActive = document.activeElement as HTMLElement | null;
        document.body.style.overflow = 'hidden';

        // Move focus into dialog
        setTimeout(() => {
            firstFieldRef.current?.focus();
        }, 0);

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();

            if (e.key !== 'Tab') return;
            if (!dialogRef.current) return;

            const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
            );

            if (!focusables.length) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKeyDown);
            previousActive?.focus?.();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const validate = () => {
        const cleanName = name.trim();
        const cleanPhone = phone.trim();

        if (!cleanName) return 'الاسم مطلوب.';
        if (cleanPhone && !/^[0-9+\-\s()]{7,}$/.test(cleanPhone)) return 'رقم الهاتف غير صالح.';
        return null;
    };

    const handleUpdate = async () => {
        if (!user?.id) return;

        const validationError = validate();
        if (validationError) {
            setErrorMsg(validationError);
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            await supabaseService.updateUserProfile(user.id, {
                full_name: name.trim(),
                phone: phone.trim(),
            });

            setSuccess(true);
            onUpdated?.({ name: name.trim(), phone: phone.trim() });

            // Close after a short success moment
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 900);
        } catch (e) {
            console.error(e);
            setErrorMsg('حدث خطأ أثناء التحديث. حاول مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onMouseDown={(e) => {
                // Click outside to close
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-profile-title"
                className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
            >
                <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-zinc-800">
                    <h3 id="edit-profile-title" className="text-xl font-black text-gray-900 dark:text-white">
                        تعديل البيانات
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-11 h-11 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors
                       flex items-center justify-center text-gray-600 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-primary/40"
                        aria-label="إغلاق"
                    >
                        <span aria-hidden="true" className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {success ? (
                        <div className="py-6 text-center space-y-3 animate-fadeIn">
                            <span aria-hidden="true" className="material-symbols-outlined text-green-500 text-6xl">check_circle</span>
                            <p className="font-black text-lg text-gray-900 dark:text-white">تم التحديث بنجاح!</p>
                        </div>
                    ) : (
                        <>
                            {errorMsg ? (
                                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-sm font-bold">
                                    {errorMsg}
                                </div>
                            ) : null}

                            <div className="space-y-1">
                                <label className="text-sm font-black text-gray-600 dark:text-gray-300 mr-2" htmlFor="profile-name">
                                    الاسم الكامل
                                </label>
                                <div className="relative">
                                    <span aria-hidden="true" className="material-symbols-outlined absolute right-4 top-3.5 text-gray-400 text-[20px]">
                                        person
                                    </span>
                                    <input
                                        id="profile-name"
                                        ref={firstFieldRef}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-zinc-800 pr-12 pl-4 py-3.5 rounded-2xl border-2 border-transparent
                               focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                        placeholder="اكتب اسمك"
                                        autoComplete="name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-black text-gray-600 dark:text-gray-300 mr-2" htmlFor="profile-phone">
                                    رقم الهاتف
                                </label>
                                <div className="relative">
                                    <span aria-hidden="true" className="material-symbols-outlined absolute right-4 top-3.5 text-gray-400 text-[20px]">
                                        phone
                                    </span>
                                    <input
                                        id="profile-phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-zinc-800 pr-12 pl-4 py-3.5 rounded-2xl border-2 border-transparent
                               focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                        placeholder="مثال: 010xxxxxxxx"
                                        autoComplete="tel"
                                        inputMode="tel"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleUpdate}
                                disabled={loading}
                                className="w-full bg-primary text-white h-12 rounded-2xl font-black mt-2 shadow-lg shadow-primary/30
                           active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span aria-hidden="true" className="material-symbols-outlined">save</span>
                                )}
                                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
