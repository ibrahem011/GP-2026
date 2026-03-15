import { useState, useMemo } from 'react';
import { Property, PropertyStatus, PropertyCategory } from '@/types';

export type SortOption = 'newest' | 'oldest' | 'views' | 'price_high' | 'price_low';
export type FilterOption = PropertyStatus | PropertyCategory | null;

export function usePropertyFilters(properties: Property[]) {
    const [filter, setFilter] = useState<FilterOption>(null);
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    const filteredProperties = useMemo(() => {
        let result = properties;

        if (filter) {
            result = result.filter(
                (p) => p.status === filter || p.category === filter
            );
        }

        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'views':
                    return b.viewsCount - a.viewsCount;
                case 'price_high':
                    return b.price - a.price;
                case 'price_low':
                    return a.price - b.price;
                default:
                    return 0;
            }
        });

        return result;
    }, [properties, filter, sortBy]);

    const availableCount = useMemo(() => properties.filter((p) => p.status === 'available').length, [properties]);
    const rentedCount = useMemo(() => properties.filter((p) => p.status === 'rented').length, [properties]);
    const totalViews = useMemo(() => properties.reduce((sum, p) => sum + p.viewsCount, 0), [properties]);

    const uniqueCategories = useMemo(() => {
        const categories = new Set(properties.map((p) => p.category));
        return Array.from(categories);
    }, [properties]);

    const isFilterEmpty = useMemo(() => filteredProperties.length === 0, [filteredProperties]);

    return {
        filter,
        setFilter,
        sortBy,
        setSortBy,
        filteredProperties,
        availableCount,
        rentedCount,
        totalViews,
        uniqueCategories,
        isFilterEmpty,
    };
}
