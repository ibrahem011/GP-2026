'use client';

import React from 'react';
import { RentalConfig } from '@/types';

interface DateSelectorProps {
    rentalConfig: RentalConfig;
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onMonthsChange?: (months: number) => void;
    errors?: {
        startDate?: string;
        endDate?: string;
    };
}

function parseDateOnly(date: string) {
    if (!date) return null;
    return new Date(`${date}T00:00:00.000Z`);
}

function formatDateOnly(date: Date) {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDailyDurationText(days: number) {
    if (days === 1) return 'ليلة واحدة';
    if (days === 2) return 'ليلتان';
    if (days >= 3 && days <= 10) return `${days} ليالي`;
    return `${days} ليلة`;
}

function getMonthlyDurationText(months: number) {
    if (months === 1) return 'شهر واحد';
    if (months === 2) return 'شهران';
    if (months >= 3 && months <= 10) return `${months} أشهر`;
    return `${months} شهر`;
}

export default function DateSelector({
    rentalConfig,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onMonthsChange,
    errors,
}: DateSelectorProps) {
    const { type, minDuration, maxDuration, seasonalConfig } = rentalConfig;

    const getTypeHelper = () => {
        if (type === 'daily') return 'الإيجار اليومي يحسب بعدد الليالي.';
        if (type === 'monthly') return 'الإيجار الشهري يحسب بالشهور الكاملة.';
        return 'الإيجار الموسمي يغطي فترة دراسية كاملة.';
    };

    const getMinStartDate = () => formatDateOnly(new Date());

    const getMinEndDate = () => {
        if (!startDate) return getMinStartDate();

        const minEnd = parseDateOnly(startDate);
        if (!minEnd) return getMinStartDate();

        if (type === 'daily') {
            minEnd.setUTCDate(minEnd.getUTCDate() + (minDuration || 1));
        } else if (type === 'monthly') {
            minEnd.setUTCMonth(minEnd.getUTCMonth() + (minDuration || 1));
        }

        return formatDateOnly(minEnd);
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        if (!date) return;

        onStartDateChange(date);

        if (endDate && date > endDate) {
            onEndDateChange(date);
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        if (!date) return;
        onEndDateChange(date);
    };

    const handleMonthsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const months = Number.parseInt(e.target.value, 10);
        if (!Number.isFinite(months)) return;

        onMonthsChange?.(months);

        if (!startDate) return;

        const start = parseDateOnly(startDate);
        if (!start) return;

        const end = new Date(start);
        end.setUTCMonth(end.getUTCMonth() + months);
        onEndDateChange(formatDateOnly(end));
    };

    const startDateObj = parseDateOnly(startDate);
    const endDateObj = parseDateOnly(endDate);

    const daysDiff = startDateObj && endDateObj
        ? Math.max(0, Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    const monthsDiff = startDateObj && endDateObj
        ? Math.max(0, (endDateObj.getUTCFullYear() - startDateObj.getUTCFullYear()) * 12 + (endDateObj.getUTCMonth() - startDateObj.getUTCMonth()))
        : 0;

    const baseInputClasses = 'w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-800';
    const labelClasses = 'mb-1 block text-sm font-semibold text-gray-700 dark:text-zinc-200';
    const hintClasses = 'text-xs text-gray-500 dark:text-zinc-400';
    const errorClasses = 'mt-1 text-xs text-red-600 dark:text-red-400';
    const fieldContainer = 'space-y-1';
    const sectionClasses = 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

    if (type === 'daily') {
        return (
            <div className={sectionClasses}>
                <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-zinc-100">اختر مواعيد الإقامة</h3>
                <p className="mb-4 text-sm text-gray-500 dark:text-zinc-400">{getTypeHelper()}</p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={fieldContainer}>
                        <label className={labelClasses} htmlFor="booking-start-date">تاريخ الوصول</label>
                        <input
                            id="booking-start-date"
                            type="date"
                            value={startDate}
                            onChange={handleStartDateChange}
                            min={getMinStartDate()}
                            className={baseInputClasses}
                            required
                        />
                        {errors?.startDate ? <p className={errorClasses}>{errors.startDate}</p> : null}
                    </div>

                    <div className={fieldContainer}>
                        <label className={labelClasses} htmlFor="booking-end-date">تاريخ المغادرة</label>
                        <input
                            id="booking-end-date"
                            type="date"
                            value={endDate}
                            onChange={handleEndDateChange}
                            min={getMinEndDate()}
                            className={baseInputClasses}
                            required
                            disabled={!startDate}
                        />
                        {errors?.endDate ? <p className={errorClasses}>{errors.endDate}</p> : null}
                    </div>
                </div>

                {startDate && endDate && daysDiff > 0 && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                        المدة: {getDailyDurationText(daysDiff)}
                    </div>
                )}
            </div>
        );
    }

    if (type === 'monthly') {
        return (
            <div className={sectionClasses}>
                <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-zinc-100">اختر فترة الإيجار</h3>
                <p className="mb-4 text-sm text-gray-500 dark:text-zinc-400">{getTypeHelper()}</p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={fieldContainer}>
                        <label className={labelClasses} htmlFor="booking-start-date">تاريخ البداية</label>
                        <input
                            id="booking-start-date"
                            type="date"
                            value={startDate}
                            onChange={handleStartDateChange}
                            min={getMinStartDate()}
                            className={baseInputClasses}
                            required
                        />
                        {errors?.startDate ? <p className={errorClasses}>{errors.startDate}</p> : null}
                    </div>

                    <div className={fieldContainer}>
                        <label className={labelClasses} htmlFor="booking-months">عدد الأشهر</label>
                        <select
                            id="booking-months"
                            onChange={handleMonthsChange}
                            className={baseInputClasses}
                            required
                            disabled={!startDate}
                            defaultValue=""
                        >
                            <option value="">اختر المدة</option>
                            {Array.from({ length: maxDuration - minDuration + 1 }, (_, i) => minDuration + i).map((months) => (
                                <option key={months} value={months}>
                                    {getMonthlyDurationText(months)}
                                </option>
                            ))}
                        </select>
                        <p className={hintClasses}>سيتم ضبط تاريخ النهاية تلقائيا.</p>
                        {errors?.endDate ? <p className={errorClasses}>{errors.endDate}</p> : null}
                    </div>
                </div>

                {endDate && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                        المدة: {getMonthlyDurationText(monthsDiff || minDuration)}
                    </div>
                )}
            </div>
        );
    }

    if (type === 'seasonal') {
        return (
            <div className={sectionClasses}>
                <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-zinc-100">الفترة الدراسية</h3>
                <p className="mb-4 text-sm text-gray-500 dark:text-zinc-400">{getTypeHelper()}</p>

                <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                        <span aria-hidden="true" className="material-symbols-outlined text-blue-600 dark:text-blue-300">school</span>
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-zinc-100">إيجار الفترة الدراسية الكاملة</h4>
                            <p className="mt-1 text-sm text-gray-600 dark:text-zinc-300">من سبتمبر إلى يونيو (10 أشهر)</p>
                        </div>
                    </div>

                    {seasonalConfig?.requiresDeposit ? (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                            <span aria-hidden="true" className="material-symbols-outlined text-amber-700 dark:text-amber-300">gpp_good</span>
                            <div>
                                <h4 className="font-semibold text-amber-800 dark:text-amber-200">تأمين مطلوب</h4>
                                <p className="mt-1 text-sm text-amber-700/90 dark:text-amber-300">سيتم استرداد التأمين عند نهاية الفترة وتسليم العقار.</p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    return null;
}
