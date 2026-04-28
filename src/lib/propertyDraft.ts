import type { PriceUnit, PropertyCategory } from '@/types';
import { normalizeEgyptianMobilePhone, normalizeLocalizedDigits } from '@/utils/validation';
import {
    getAreaMapZone,
    isAreaName,
    isPointWithinAreaZone,
    type AreaName,
    type PropertyLocationValue,
} from './propertyAreas';

export type PropertyDraftField =
    | 'title'
    | 'description'
    | 'price'
    | 'bedrooms'
    | 'bathrooms'
    | 'area'
    | 'floor'
    | 'selectedArea'
    | 'address'
    | 'ownerName'
    | 'ownerPhone'
    | 'location';

export type PropertyDraftErrors = Partial<Record<PropertyDraftField, string>>;

export interface PropertyDraftInput {
    title: string;
    description: string;
    price: string | number;
    priceUnit: PriceUnit;
    category: PropertyCategory;
    bedrooms: string | number;
    bathrooms: string | number;
    area: string | number;
    floor: string | number;
    features: string[];
    address: string;
    selectedArea: string;
    ownerName: string;
    ownerPhone: string;
}

export interface ValidatedPropertyDraft {
    title: string;
    description: string;
    price: number;
    priceUnit: PriceUnit;
    category: PropertyCategory;
    bedrooms: number;
    bathrooms: number;
    floorArea: number | null;
    floor: number;
    features: string[];
    address: string;
    selectedArea: AreaName;
    ownerName: string;
    ownerPhone: string;
    location: PropertyLocationValue | null;
}

export interface PropertyInsertPayload {
    title: string;
    description: string;
    price: number;
    price_unit: PriceUnit;
    category: PropertyCategory;
    location_lat: number | null;
    location_lng: number | null;
    address: string;
    area: AreaName;
    bedrooms: number;
    bathrooms: number;
    floor_area: number | null;
    floor_number: number;
    features: string[];
    owner_phone: string;
    owner_name: string;
}

export class PropertyDraftValidationError extends Error {
    fieldErrors: PropertyDraftErrors;

    constructor(message: string, fieldErrors: PropertyDraftErrors) {
        super(message);
        this.name = 'PropertyDraftValidationError';
        this.fieldErrors = fieldErrors;
    }
}

const INTEGER_PATTERN = /^-?\d+$/;

function normalizeText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function normalizeNumericText(value: string): string {
    return normalizeLocalizedDigits(value).replace(/\s+/g, '').trim();
}

function parseIntegerField(
    rawValue: string | number,
    { min, max, optional = false }: { min: number; max: number; optional?: boolean },
): { value: number | null; isValid: boolean } {
    if (typeof rawValue === 'number') {
        if (!Number.isInteger(rawValue) || rawValue < min || rawValue > max) {
            return { value: null, isValid: false };
        }

        return { value: rawValue, isValid: true };
    }

    const normalized = normalizeNumericText(rawValue);
    if (!normalized) {
        return {
            value: null,
            isValid: optional,
        };
    }

    if (!INTEGER_PATTERN.test(normalized)) {
        return { value: null, isValid: false };
    }

    const parsed = Number(normalized);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        return { value: null, isValid: false };
    }

    return { value: parsed, isValid: true };
}

function normalizeLocation(
    location: PropertyLocationValue | null | undefined,
): { value: PropertyLocationValue | null; isValid: boolean } {
    if (!location) {
        return { value: null, isValid: true };
    }

    const lat = typeof location.lat === 'number' ? location.lat : Number.NaN;
    const lng = typeof location.lng === 'number' ? location.lng : Number.NaN;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return { value: null, isValid: false };
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return { value: null, isValid: false };
    }

    return { value: { lat, lng }, isValid: true };
}

export function validatePropertyDraft(
    input: PropertyDraftInput,
    location: PropertyLocationValue | null | undefined,
): { normalizedData: ValidatedPropertyDraft | null; fieldErrors: PropertyDraftErrors } {
    const fieldErrors: PropertyDraftErrors = {};
    const title = normalizeText(input.title);
    const description = normalizeText(input.description);
    const address = normalizeText(input.address);
    const ownerName = normalizeText(input.ownerName);
    const selectedArea = isAreaName(input.selectedArea) ? input.selectedArea : null;
    const normalizedPhone = normalizeEgyptianMobilePhone(input.ownerPhone);

    if (!title) {
        fieldErrors.title = 'عنوان العقار مطلوب.';
    }

    if (!description) {
        fieldErrors.description = 'وصف العقار مطلوب.';
    }

    if (!address) {
        fieldErrors.address = 'العنوان التفصيلي مطلوب.';
    }

    if (!selectedArea) {
        fieldErrors.selectedArea = 'اختر المنطقة أولاً.';
    }

    if (!ownerName) {
        fieldErrors.ownerName = 'اسم صاحب العقار مطلوب.';
    }

    if (!normalizedPhone) {
        fieldErrors.ownerPhone = 'أدخل رقم موبايل مصري صحيح.';
    }

    const price = parseIntegerField(input.price, { min: 1, max: 100_000_000 });
    if (!price.isValid || price.value == null) {
        fieldErrors.price = 'السعر يجب أن يكون رقماً صحيحاً أكبر من صفر.';
    }

    const bedrooms = parseIntegerField(input.bedrooms, { min: 0, max: 20 });
    if (!bedrooms.isValid || bedrooms.value == null) {
        fieldErrors.bedrooms = 'عدد الغرف يجب أن يكون بين 0 و20.';
    }

    const bathrooms = parseIntegerField(input.bathrooms, { min: 0, max: 20 });
    if (!bathrooms.isValid || bathrooms.value == null) {
        fieldErrors.bathrooms = 'عدد الحمامات يجب أن يكون بين 0 و20.';
    }

    const floor = parseIntegerField(input.floor, { min: 0, max: 60 });
    if (!floor.isValid || floor.value == null) {
        fieldErrors.floor = 'الدور يجب أن يكون بين 0 و60.';
    }

    const floorArea = parseIntegerField(input.area, { min: 1, max: 5_000, optional: true });
    if (!floorArea.isValid) {
        fieldErrors.area = 'المساحة يجب أن تكون رقماً صحيحاً بين 1 و5000 متر.';
    }

    const normalizedLocation = normalizeLocation(location);
    if (!normalizedLocation.isValid) {
        fieldErrors.location = 'إحداثيات الموقع غير صالحة.';
    } else if (
        normalizedLocation.value &&
        selectedArea &&
        !isPointWithinAreaZone(normalizedLocation.value, selectedArea)
    ) {
        const areaLabel = getAreaMapZone(selectedArea) ? selectedArea : 'المنطقة المختارة';
        fieldErrors.location = `النقطة المحددة خارج نطاق ${areaLabel}.`;
    }

    if (Object.keys(fieldErrors).length > 0) {
        return {
            normalizedData: null,
            fieldErrors,
        };
    }

    return {
        normalizedData: {
            title,
            description,
            price: price.value as number,
            priceUnit: input.priceUnit,
            category: input.category,
            bedrooms: bedrooms.value as number,
            bathrooms: bathrooms.value as number,
            floorArea: floorArea.value,
            floor: floor.value as number,
            features: Array.from(new Set(input.features.filter(Boolean))),
            address,
            selectedArea: selectedArea as AreaName,
            ownerName,
            ownerPhone: normalizedPhone as string,
            location: normalizedLocation.value,
        },
        fieldErrors: {},
    };
}

export function buildPropertyInsertPayload(input: ValidatedPropertyDraft): PropertyInsertPayload {
    return {
        title: input.title,
        description: input.description,
        price: input.price,
        price_unit: input.priceUnit,
        category: input.category,
        location_lat: input.location?.lat ?? null,
        location_lng: input.location?.lng ?? null,
        address: input.address,
        area: input.selectedArea,
        owner_phone: input.ownerPhone,
        owner_name: input.ownerName,
        features: input.features,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        floor_area: input.floorArea,
        floor_number: input.floor,
    };
}

export function validatePropertyInsertPayload(input: {
    title?: string | null;
    description?: string | null;
    price?: number | null;
    price_unit?: PriceUnit | null;
    category?: PropertyCategory | null;
    location_lat?: number | null;
    location_lng?: number | null;
    address?: string | null;
    area?: string | null;
    owner_phone?: string | null;
    owner_name?: string | null;
    features?: string[] | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    floor_area?: number | null;
    floor_number?: number | null;
}): ValidatedPropertyDraft {
    const hasAnyLocation = input.location_lat != null || input.location_lng != null;
    if (hasAnyLocation && (input.location_lat == null || input.location_lng == null)) {
        throw new PropertyDraftValidationError('بيانات الموقع غير مكتملة.', {
            location: 'حدد خط العرض وخط الطول معاً أو اترك الموقع فارغاً.',
        });
    }

    const { normalizedData, fieldErrors } = validatePropertyDraft(
        {
            title: input.title ?? '',
            description: input.description ?? '',
            price: input.price ?? '',
            priceUnit: input.price_unit ?? 'day',
            category: input.category ?? 'apartment',
            bedrooms: input.bedrooms ?? 0,
            bathrooms: input.bathrooms ?? 0,
            area: input.floor_area ?? '',
            floor: input.floor_number ?? 0,
            features: input.features ?? [],
            address: input.address ?? '',
            selectedArea: input.area ?? '',
            ownerName: input.owner_name ?? '',
            ownerPhone: input.owner_phone ?? '',
        },
        hasAnyLocation
            ? {
                  lat: input.location_lat as number,
                  lng: input.location_lng as number,
              }
            : null,
    );

    if (!normalizedData) {
        throw new PropertyDraftValidationError('بيانات العقار غير صالحة للنشر.', fieldErrors);
    }

    return normalizedData;
}
