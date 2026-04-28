export const validateMessage = (text: string): { isValid: boolean; error?: string } => {
    if (!text) return { isValid: false, error: 'الرسالة فارغة' };
    if (text.length > 5000) return { isValid: false, error: 'الرسالة طويلة جداً (الحد الأقصى 5000 حرف)' };
    return { isValid: true };
};

export const validateFile = (file: File, type: 'image' | 'voice'): { isValid: boolean; error?: string } => {
    if (type === 'image') {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            return { isValid: false, error: 'نوع الملف غير مدعوم. يرجى استخدام (JPG, PNG, WEBP)' };
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            return { isValid: false, error: 'حجم الصورة يجب أن لا يتعدى 5 ميجابايت' };
        }
    } else if (type === 'voice') {
        const validTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg'];
        // Note: Browsers recording usually output audio/webm
        if (!file.type.startsWith('audio/')) {
            return { isValid: false, error: 'ملف صوتي غير صالح' };
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB
            return { isValid: false, error: 'حجم التسجيل يجب أن لا يتعدى 10 ميجابايت' };
        }
    }
    return { isValid: true };
};

export const sanitizeText = (text: string): string => {
    // Basic sanitization to prevent XSS (React handles most by default, but good for raw data)
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

export const validateDateString = (dateStr: string): boolean => {
    // ISO 8601 format: YYYY-MM-DD
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!isoDateRegex.test(dateStr)) {
        return false;
    }

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
};

export const validateUUID = (uuid: string): boolean => {
    // UUID v1-v5 format regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

const ARABIC_INDIC_DIGIT_MAP: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
};

export const normalizeLocalizedDigits = (input: string): string =>
    input
        .split('')
        .map((char) => ARABIC_INDIC_DIGIT_MAP[char] ?? char)
        .join('');

export const sanitizePhoneInput = (input: string): string => {
    const normalizedDigits = normalizeLocalizedDigits(input);

    const trimmed = normalizedDigits.trim().replace(/[\s()-]+/g, '');
    const hasLeadingPlus = trimmed.startsWith('+');
    const digitsOnly = trimmed.replace(/\D/g, '');

    if (!digitsOnly) return hasLeadingPlus ? '+' : '';
    return `${hasLeadingPlus ? '+' : ''}${digitsOnly}`;
};

export const normalizeEgyptianMobilePhone = (input: string): string | null => {
    const sanitized = sanitizePhoneInput(input);
    const digitsOnly = sanitized.replace(/\D/g, '');

    if (!digitsOnly) return null;

    if (/^01\d{9}$/.test(digitsOnly)) {
        return digitsOnly;
    }

    if (/^20\d{10}$/.test(digitsOnly)) {
        const localFormat = `0${digitsOnly.slice(2)}`;
        return /^01\d{9}$/.test(localFormat) ? localFormat : null;
    }

    return null;
};
