import { describe, expect, it } from 'vitest';

import {
    PROPERTY_IMAGE_PLACEHOLDER,
    normalizePropertyImageList,
    normalizePropertyImageSrc,
} from '../propertyImages';

describe('propertyImages', () => {
    it('maps legacy local property jpg images to existing png assets', () => {
        expect(normalizePropertyImageSrc('/images/property1.jpg')).toBe('/images/property1.png');
        expect(normalizePropertyImageSrc('/images/property4.jpg')).toBe('/images/property4.png');
    });

    it('falls back to the shared placeholder for missing local property assets', () => {
        expect(normalizePropertyImageSrc('/images/property5.jpg')).toBe(PROPERTY_IMAGE_PLACEHOLDER);
    });

    it('preserves valid remote image URLs', () => {
        const remoteUrl = 'https://images.example.com/property.jpg?width=800';
        expect(normalizePropertyImageSrc(remoteUrl)).toBe(remoteUrl);
    });

    it('returns the placeholder for empty values', () => {
        expect(normalizePropertyImageSrc('')).toBe(PROPERTY_IMAGE_PLACEHOLDER);
        expect(normalizePropertyImageSrc(null)).toBe(PROPERTY_IMAGE_PLACEHOLDER);
        expect(normalizePropertyImageSrc(undefined)).toBe(PROPERTY_IMAGE_PLACEHOLDER);
    });

    it('normalizes image collections and guarantees a non-empty gallery', () => {
        expect(
            normalizePropertyImageList([
                '',
                '/images/property1.jpg',
                '/images/property5.jpg',
                '/images/property1.jpg',
            ]),
        ).toEqual(['/images/property1.png', PROPERTY_IMAGE_PLACEHOLDER]);

        expect(normalizePropertyImageList([])).toEqual([PROPERTY_IMAGE_PLACEHOLDER]);
    });
});
