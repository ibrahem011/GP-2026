const REMOTE_IMAGE_REGEX = /^(https?:)?\/\//i;
const LEGACY_PROPERTY_JPG_REGEX = /^\/images\/property\d+\.jpg$/i;

export const PROPERTY_IMAGE_PLACEHOLDER = '/images/property-placeholder.svg';

const LEGACY_IMAGE_ALIASES = new Map<string, string>([
    ['/images/property1.jpg', '/images/property1.png'],
    ['/images/property2.jpg', '/images/property2.png'],
    ['/images/property3.jpg', '/images/property3.png'],
    ['/images/property4.jpg', '/images/property4.png'],
    ['/images/placeholder.jpg', PROPERTY_IMAGE_PLACEHOLDER],
    ['/placeholder.jpg', PROPERTY_IMAGE_PLACEHOLDER],
    ['/placeholder-property.jpg', PROPERTY_IMAGE_PLACEHOLDER],
    ['/placeholder-house.jpg', PROPERTY_IMAGE_PLACEHOLDER],
]);

function splitPathAndSuffix(value: string) {
    const match = value.match(/^([^?#]*)([?#].*)?$/);
    return {
        pathname: match?.[1] || value,
        suffix: match?.[2] || '',
    };
}

function normalizeLocalPropertyImagePath(value: string): string {
    const normalizedValue = value.startsWith('/') ? value : `/${value}`;
    const { pathname, suffix } = splitPathAndSuffix(normalizedValue);
    const aliasedPath = LEGACY_IMAGE_ALIASES.get(pathname);

    if (aliasedPath) {
        return `${aliasedPath}${suffix}`;
    }

    if (LEGACY_PROPERTY_JPG_REGEX.test(pathname)) {
        return PROPERTY_IMAGE_PLACEHOLDER;
    }

    return `${pathname}${suffix}`;
}

export function normalizePropertyImageSrc(value: string | null | undefined): string {
    const trimmed = value?.trim();

    if (!trimmed) {
        return PROPERTY_IMAGE_PLACEHOLDER;
    }

    if (
        trimmed.startsWith('data:') ||
        trimmed.startsWith('blob:') ||
        REMOTE_IMAGE_REGEX.test(trimmed)
    ) {
        return trimmed;
    }

    return normalizeLocalPropertyImagePath(trimmed);
}

export function normalizePropertyImageList(
    values: Array<string | null | undefined> | null | undefined,
): string[] {
    const normalized: string[] = [];

    for (const value of values || []) {
        if (!value?.trim()) {
            continue;
        }

        const nextValue = normalizePropertyImageSrc(value);
        if (!normalized.includes(nextValue)) {
            normalized.push(nextValue);
        }
    }

    return normalized.length > 0 ? normalized : [PROPERTY_IMAGE_PLACEHOLDER];
}
