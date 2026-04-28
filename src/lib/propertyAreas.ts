import { AREAS, GAMASA_CENTER } from '@/types';

export type AreaName = (typeof AREAS)[number];

export interface AreaMapZone {
    center: {
        lat: number;
        lng: number;
    };
    radiusMeters: number;
    zoom: number;
}

export interface PropertyLocationValue {
    lat: number;
    lng: number;
}

export const AREA_MAP_ZONES: Record<AreaName, AreaMapZone> = {
    [AREAS[0]]: {
        center: { lat: 31.4484, lng: 31.5442 },
        radiusMeters: 500,
        zoom: 16,
    },
    [AREAS[1]]: {
        center: { lat: 31.4435, lng: 31.5336 },
        radiusMeters: 650,
        zoom: 15,
    },
    [AREAS[2]]: {
        center: { lat: 31.4456, lng: 31.5477 },
        radiusMeters: 520,
        zoom: 16,
    },
    [AREAS[3]]: {
        center: { lat: 31.4396, lng: 31.5552 },
        radiusMeters: 720,
        zoom: 15,
    },
    [AREAS[4]]: {
        center: { lat: 31.4461, lng: 31.5488 },
        radiusMeters: 420,
        zoom: 16,
    },
    [AREAS[5]]: {
        center: { lat: 31.4443, lng: 31.5268 },
        radiusMeters: 950,
        zoom: 14,
    },
    [AREAS[6]]: {
        center: { lat: 31.4449, lng: 31.5604 },
        radiusMeters: 900,
        zoom: 14,
    },
};

export function isAreaName(area: string | null | undefined): area is AreaName {
    return Boolean(area && area in AREA_MAP_ZONES);
}

export function getAreaMapZone(area: string | null | undefined): AreaMapZone | null {
    if (!isAreaName(area)) {
        return null;
    }

    return AREA_MAP_ZONES[area];
}

function degreesToRadians(value: number): number {
    return (value * Math.PI) / 180;
}

export function getDistanceBetweenPointsInMeters(a: PropertyLocationValue, b: PropertyLocationValue): number {
    const earthRadiusMeters = 6_371_000;
    const latDiff = degreesToRadians(b.lat - a.lat);
    const lngDiff = degreesToRadians(b.lng - a.lng);
    const lat1 = degreesToRadians(a.lat);
    const lat2 = degreesToRadians(b.lat);

    const haversine =
        Math.sin(latDiff / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDiff / 2) ** 2;

    return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function isPointWithinAreaZone(location: PropertyLocationValue, area: string | null | undefined): boolean {
    const zone = getAreaMapZone(area);
    if (!zone) {
        return false;
    }

    return getDistanceBetweenPointsInMeters(location, zone.center) <= zone.radiusMeters;
}

export function getAreaViewport(area: string | null | undefined): { center: PropertyLocationValue; zoom: number } {
    const zone = getAreaMapZone(area);

    return {
        center: zone?.center ?? GAMASA_CENTER,
        zoom: zone?.zoom ?? 15,
    };
}
