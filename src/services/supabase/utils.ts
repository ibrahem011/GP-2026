const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isMissingRpcFunctionError(error: any, functionName: string): boolean {
    if (!error) return false;

    const code = typeof error.code === 'string' ? error.code : '';
    const message = typeof error.message === 'string' ? error.message : '';
    const details = typeof error.details === 'string' ? error.details : '';
    const hint = typeof error.hint === 'string' ? error.hint : '';

    if (code === 'PGRST202') {
        return true;
    }

    return [message, details, hint].some((value) => value.includes(functionName));
}

export function normalizeDateOnly(value: string): string | null {
    if (!value) return null;

    const trimmed = value.trim();
    const maybeDateOnly = DATE_ONLY_REGEX.test(trimmed) ? trimmed : trimmed.split('T')[0];

    if (!DATE_ONLY_REGEX.test(maybeDateOnly)) return null;

    const [year, month, day] = maybeDateOnly.split('-').map(Number);
    const candidate = new Date(Date.UTC(year, month - 1, day));

    if (
        candidate.getUTCFullYear() !== year ||
        candidate.getUTCMonth() + 1 !== month ||
        candidate.getUTCDate() !== day
    ) {
        return null;
    }

    return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function buildBookingSystemMessage(startDate: string, endDate: string): string {
    return `تم إرسال طلب حجز جديد للفترة من ${startDate} إلى ${endDate}.`;
}

export function coerceSingleRelation<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
}
