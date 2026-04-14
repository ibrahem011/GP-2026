import type { PropertyRowCompat } from './propertyMapper';

export type PropertyCollection = 'featured' | 'recent';
export type HomeSectionLayoutMode =
    | 'spotlight-single'
    | 'spotlight-grid'
    | 'standard-grid';

type FeaturedComparable = Pick<PropertyRowCompat, 'created_at' | 'is_verified' | 'views_count'>;
type RecentComparable = Pick<PropertyRowCompat, 'created_at'>;

function toTimestamp(value: string | null | undefined): number {
    const parsed = Date.parse(value ?? '');
    return Number.isFinite(parsed) ? parsed : 0;
}

export function isPropertyCollection(
    value: string | null | undefined,
): value is PropertyCollection {
    return value === 'featured' || value === 'recent';
}

export function compareFeaturedPropertyRows(
    a: FeaturedComparable,
    b: FeaturedComparable,
): number {
    const verifiedDiff = Number(Boolean(b.is_verified)) - Number(Boolean(a.is_verified));
    if (verifiedDiff !== 0) {
        return verifiedDiff;
    }

    const viewsDiff = (b.views_count ?? 0) - (a.views_count ?? 0);
    if (viewsDiff !== 0) {
        return viewsDiff;
    }

    return toTimestamp(b.created_at) - toTimestamp(a.created_at);
}

export function compareRecentPropertyRows(
    a: RecentComparable,
    b: RecentComparable,
): number {
    return toTimestamp(b.created_at) - toTimestamp(a.created_at);
}

export function buildHomeRecentProperties<T extends { id: string }>(
    featuredItems: T[],
    recentItems: T[],
    limit: number,
): T[] {
    const featuredIds = new Set(featuredItems.map((item) => item.id));
    const dedupedRecentItems = recentItems.filter((item) => !featuredIds.has(item.id));
    return dedupedRecentItems.slice(0, limit);
}

export function getHomeSectionLayoutMode(count: number): HomeSectionLayoutMode {
    if (count === 1) {
        return 'spotlight-single';
    }

    if (count === 2) {
        return 'spotlight-grid';
    }

    return 'standard-grid';
}
