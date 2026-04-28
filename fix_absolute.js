const fs = require('fs');
let content = fs.readFileSync('src/services/supabaseService.ts', 'utf8');

const helpers = `
// --- RESILIENCE HELPERS ---
export interface RequestResilienceOptions {
    timeoutMs?: number;
    maxRetries?: number;
    signal?: AbortSignal;
}

export interface CreateFullPropertyOptions extends RequestResilienceOptions {
    onStageChange?: (stage: 'preparing' | 'uploading' | 'saving') => void;
}

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;

export async function withTimeout<T>(promise: Promise<T>, timeoutMs?: number, signal?: AbortSignal): Promise<T> {
    const ms = timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            const err: any = new Error('Request timed out');
            err.code = 'REQUEST_TIMEOUT';
            reject(err);
        }, ms);

        const onAbort = () => {
            clearTimeout(timer);
            const err: any = new Error('Request aborted');
            err.name = 'AbortError';
            reject(err);
        };

        if (signal) {
            if (signal.aborted) return onAbort();
            signal.addEventListener('abort', onAbort);
        }

        promise.then(
            (val) => {
                clearTimeout(timer);
                if (signal) signal.removeEventListener('abort', onAbort);
                resolve(val);
            },
            (err) => {
                clearTimeout(timer);
                if (signal) signal.removeEventListener('abort', onAbort);
                reject(err);
            }
        );
    });
}

export function isTimeoutLikeError(error: any) {
    return error?.code === 'REQUEST_TIMEOUT' || error?.name === 'AbortError' || error?.message?.toLowerCase().includes('timeout');
}

export async function fetchWithRetry<T>(fn: () => Promise<T>, options?: RequestResilienceOptions): Promise<T> {
    const maxRetries = options?.maxRetries ?? 2;
    let attempt = 0;
    while (true) {
        try {
            return await withTimeout(fn(), options?.timeoutMs, options?.signal);
        } catch (error) {
            if (attempt >= maxRetries || !isTimeoutLikeError(error)) {
                throw error;
            }
            attempt++;
            await new Promise(res => setTimeout(res, 1000 * attempt));
        }
    }
}

export function createCreateFullPropertyError(code: string, message: string, originalError?: any) {
    const err: any = new Error(message);
    err.code = code;
    err.originalError = originalError;
    return err;
}
// --- END RESILIENCE HELPERS ---

`;

if (!content.includes('interface RequestResilienceOptions')) {
    content = content.replace("export { getIsMockMode };", "export { getIsMockMode };\n" + helpers);
}

// Ensure respondToBookingRequest exists
if (!content.includes('respondToBookingRequest')) {
    content = content.replace('export const supabaseService = {', 'export const supabaseService = {\n    async respondToBookingRequest(bookingId: string, status: string, propertyOwnerId?: string): Promise<{ success: boolean; error: any }> {\n        const { error } = await supabase.from(\'bookings\').update({ status }).eq(\'id\', bookingId);\n        return { success: !error, error };\n    },');
}

fs.writeFileSync('src/services/supabaseService.ts', content, 'utf8');
console.log('Final absolute fix applied');
