import { describe, expect, it } from 'vitest';
import {
    buildHomeRecentProperties,
    compareFeaturedPropertyRows,
    compareRecentPropertyRows,
    getHomeSectionLayoutMode,
} from '../propertyCollections';

describe('propertyCollections helpers', () => {
    it('sorts featured properties by verification, views, then creation date', () => {
        const rows = [
            {
                id: 'older-most-viewed',
                is_verified: true,
                views_count: 250,
                created_at: '2026-04-01T08:00:00Z',
            },
            {
                id: 'newer-most-viewed',
                is_verified: true,
                views_count: 250,
                created_at: '2026-04-02T08:00:00Z',
            },
            {
                id: 'not-verified',
                is_verified: false,
                views_count: 999,
                created_at: '2026-04-03T08:00:00Z',
            },
        ];

        const sortedRows = [...rows].sort(compareFeaturedPropertyRows);

        expect(sortedRows.map((row) => row.id)).toEqual([
            'newer-most-viewed',
            'older-most-viewed',
            'not-verified',
        ]);
    });

    it('sorts recent properties by creation date descending', () => {
        const rows = [
            { id: 'older', created_at: '2026-04-01T08:00:00Z' },
            { id: 'newest', created_at: '2026-04-03T08:00:00Z' },
            { id: 'middle', created_at: '2026-04-02T08:00:00Z' },
        ];

        const sortedRows = [...rows].sort(compareRecentPropertyRows);

        expect(sortedRows.map((row) => row.id)).toEqual(['newest', 'middle', 'older']);
    });

    it('builds recent home cards without featured duplicates and respects the limit', () => {
        const featured = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }, { id: 'p5' }];
        const recent = [{ id: 'p5' }, { id: 'p6' }, { id: 'p2' }, { id: 'p7' }, { id: 'p8' }];

        const homeRecent = buildHomeRecentProperties(featured, recent, 3);

        expect(homeRecent.map((property) => property.id)).toEqual(['p6', 'p7', 'p8']);
    });

    it('chooses the spotlight single layout for one property', () => {
        expect(getHomeSectionLayoutMode(1)).toBe('spotlight-single');
    });

    it('chooses the spotlight grid layout for two properties', () => {
        expect(getHomeSectionLayoutMode(2)).toBe('spotlight-grid');
    });

    it('chooses the standard grid layout for three or more properties', () => {
        expect(getHomeSectionLayoutMode(3)).toBe('standard-grid');
        expect(getHomeSectionLayoutMode(6)).toBe('standard-grid');
    });
});
