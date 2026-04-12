export const STORAGE_BUCKETS = {
    propertiesImages: 'properties-images',
    paymentReceipts: 'payment-receipts',
    chatImages: 'chat-images',
    voiceNotes: 'voice-notes',
} as const;

export type StorageBucketName = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

const STORAGE_URL_REGEX = /\/storage\/v1\/object\/(?:public|sign)\/([^/?#]+)\/([^?#]+)/i;

export function isDisplayableUrl(value: string): boolean {
    return /^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('/');
}

export function extractStoragePath(value: string, bucket: StorageBucketName): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const match = trimmed.match(STORAGE_URL_REGEX);
    if (match) {
        const [, bucketName, rawPath] = match;
        if (bucketName !== bucket) return null;

        try {
            return decodeURIComponent(rawPath);
        } catch {
            return rawPath;
        }
    }

    if (isDisplayableUrl(trimmed)) {
        return null;
    }

    return trimmed;
}

export function toStorageReference(value: string | null | undefined, bucket: StorageBucketName) {
    if (!value) {
        return {
            original: null,
            path: null,
            passthrough: null,
        };
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return {
            original: null,
            path: null,
            passthrough: null,
        };
    }

    const path = extractStoragePath(trimmed, bucket);

    if (path) {
        const matchedFromUrl = path !== trimmed;
        return {
            original: trimmed,
            path,
            passthrough: matchedFromUrl ? trimmed : null,
        };
    }

    return {
        original: trimmed,
        path: null,
        passthrough: trimmed,
    };
}

export function buildStorageObjectPath(...segments: string[]): string {
    return segments
        .map((segment) => segment.trim().replace(/^\/+|\/+$/g, ''))
        .filter(Boolean)
        .join('/');
}

