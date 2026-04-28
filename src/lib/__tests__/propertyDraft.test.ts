import { describe, expect, it } from 'vitest';

import { AREAS } from '@/types';
import { AREA_MAP_ZONES, isPointWithinAreaZone } from '../propertyAreas';
import {
    buildPropertyInsertPayload,
    validatePropertyDraft,
    validatePropertyInsertPayload,
} from '../propertyDraft';

describe('propertyDraft helpers', () => {
    it('normalizes phone numbers and keeps floor area nullable', () => {
        const area = AREAS[0];
        const { normalizedData, fieldErrors } = validatePropertyDraft(
            {
                title: '  شقة   مميزة  ',
                description: '  قريبة   من البحر  ',
                price: '1500',
                priceUnit: 'day',
                category: 'apartment',
                bedrooms: '3',
                bathrooms: '2',
                area: '',
                floor: '5',
                features: ['wifi', 'wifi', 'parking'],
                address: '  شارع البحر  ',
                selectedArea: area,
                ownerName: '  أحمد  ',
                ownerPhone: '+20 1012345678',
            },
            null,
        );

        expect(fieldErrors).toEqual({});
        expect(normalizedData).not.toBeNull();
        expect(normalizedData?.title).toBe('شقة مميزة');
        expect(normalizedData?.description).toBe('قريبة من البحر');
        expect(normalizedData?.ownerPhone).toBe('01012345678');
        expect(normalizedData?.floorArea).toBeNull();

        const payload = buildPropertyInsertPayload(normalizedData!);
        expect(payload.floor_area).toBeNull();
        expect(payload.location_lat).toBeNull();
        expect(payload.location_lng).toBeNull();
        expect(payload.features).toEqual(['wifi', 'parking']);
    });

    it('rejects invalid numeric ranges and out-of-zone locations', () => {
        const area = AREAS[0];
        const zone = AREA_MAP_ZONES[area];
        const { normalizedData, fieldErrors } = validatePropertyDraft(
            {
                title: 'عقار',
                description: 'وصف صالح',
                price: '0',
                priceUnit: 'day',
                category: 'apartment',
                bedrooms: '21',
                bathrooms: '1',
                area: '6000',
                floor: '61',
                features: [],
                address: 'عنوان',
                selectedArea: area,
                ownerName: 'مالك',
                ownerPhone: '01012345678',
            },
            {
                lat: zone.center.lat + 1,
                lng: zone.center.lng + 1,
            },
        );

        expect(normalizedData).toBeNull();
        expect(fieldErrors.price).toBeTruthy();
        expect(fieldErrors.bedrooms).toBeTruthy();
        expect(fieldErrors.area).toBeTruthy();
        expect(fieldErrors.floor).toBeTruthy();
        expect(fieldErrors.location).toContain(area);
    });

    it('validates insert payloads with optional coordinates', () => {
        const normalized = validatePropertyInsertPayload({
            title: 'شقة',
            description: 'وصف',
            price: 2500,
            price_unit: 'day',
            category: 'apartment',
            location_lat: null,
            location_lng: null,
            address: 'شارع رئيسي',
            area: AREAS[1],
            bedrooms: 2,
            bathrooms: 1,
            floor_area: null,
            floor_number: 3,
            owner_phone: '01012345678',
            owner_name: 'مالك',
            features: ['wifi'],
        });

        expect(normalized.location).toBeNull();
        expect(normalized.floorArea).toBeNull();
    });
});

describe('propertyAreas helpers', () => {
    it('confirms that the area center is inside its own zone', () => {
        const area = AREAS[0];
        const zone = AREA_MAP_ZONES[area];

        expect(isPointWithinAreaZone(zone.center, area)).toBe(true);
        expect(
            isPointWithinAreaZone(
                {
                    lat: zone.center.lat + 1,
                    lng: zone.center.lng + 1,
                },
                area,
            ),
        ).toBe(false);
    });
});
