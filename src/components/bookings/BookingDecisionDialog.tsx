'use client';

import { useEffect, useState } from 'react';

type BookingDecisionAction = 'landlord_confirm' | 'landlord_reject';

interface BookingDecisionDialogProps {
    open: boolean;
    action: BookingDecisionAction;
    bookingTitle: string;
    guestName?: string;
    initialNote?: string;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (note: string) => void | Promise<void>;
}

export default function BookingDecisionDialog({
    open,
    action,
    bookingTitle,
    guestName,
    initialNote = '',
    loading = false,
    onClose,
    onSubmit,
}: BookingDecisionDialogProps) {
    const [note, setNote] = useState(initialNote);

    useEffect(() => {
        if (open) {
            setNote(initialNote);
        }
    }, [initialNote, open]);

    if (!open) {
        return null;
    }

    const isConfirm = action === 'landlord_confirm';
    const title = isConfirm ? 'تأكيد قبول الحجز' : 'تأكيد رفض الحجز';
    const submitLabel = isConfirm ? 'قبول الحجز' : 'رفض الحجز';
    const accentClassName = isConfirm
        ? 'bg-emerald-500 hover:bg-emerald-600'
        : 'bg-rose-500 hover:bg-rose-600';
    const helper = isConfirm
        ? 'يمكنك كتابة رسالة للمستأجر مثل تعليمات الاستلام أو أي ملاحظة مهمة.'
        : 'يمكنك توضيح سبب الرفض ليظهر للمستأجر داخل تفاصيل الحجز.';

    return (
        <div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="booking-decision-title"
                className="w-full max-w-lg rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] dark:bg-zinc-900"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-slate-200 dark:bg-zinc-700 sm:hidden" />

                <h2
                    id="booking-decision-title"
                    className="text-xl font-black text-slate-900 dark:text-white"
                >
                    {title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
                    {guestName ? `الضيف: ${guestName}، ` : ''}
                    العقار: {bookingTitle}
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-400 dark:text-slate-500">
                    {helper}
                </p>

                <label className="mt-5 block text-sm font-bold text-slate-800 dark:text-slate-100" htmlFor="booking-decision-note">
                    ملاحظة المؤجر
                </label>
                <textarea
                    id="booking-decision-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={5}
                    placeholder={isConfirm ? 'مثال: تم القبول، يرجى التواصل قبل الوصول بساعتين.' : 'مثال: هذه التواريخ غير متاحة بسبب صيانة مجدولة.'}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
                />

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-2xl bg-slate-100 py-3.5 font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/10"
                    >
                        إلغاء
                    </button>
                    <button
                        type="button"
                        onClick={() => void onSubmit(note)}
                        disabled={loading}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${accentClassName}`}
                    >
                        {loading ? (
                            <span
                                aria-hidden="true"
                                className="material-symbols-outlined animate-spin text-[20px]"
                            >
                                progress_activity
                            </span>
                        ) : null}
                        <span>{submitLabel}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
