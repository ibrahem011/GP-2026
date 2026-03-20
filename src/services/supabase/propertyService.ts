import { isMockModeEnabled, supabase } from './client';
import { MOCK_PROPERTIES, _mockFavorites, _mockUnlocked } from './mockData';
import type { FavoriteReferenceRow, PropertyInsert, PropertyRow } from './types';
import { isMissingRpcFunctionError } from './utils';

const FAVORITES_PROPERTY_SELECT = `
    id,
    owner_id,
    title,
    description,
    price,
    price_unit,
    category,
    status,
    images,
    location_lat,
    location_lng,
    address,
    area,
    bedrooms,
    bathrooms,
    floor_area,
    floor_number,
    features,
    owner_phone,
    owner_name,
    is_verified,
    views_count,
    created_at,
    updated_at
`;

type PropertyServiceDependencies = {
    uploadPropertyImages: (files: File[], userId: string) => Promise<string[]>;
    deletePropertyImage: (url: string) => Promise<void>;
};

async function getFavoritesFallback(userId: string): Promise<{ data: PropertyRow[]; error: any }> {
    const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('property_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (favoritesError) {
        return { data: [], error: favoritesError };
    }

    const propertyIds = ((favoritesData || []) as FavoriteReferenceRow[]).map((row) => row.property_id);

    if (propertyIds.length === 0) {
        return { data: [], error: null };
    }

    const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(FAVORITES_PROPERTY_SELECT)
        .in('id', propertyIds);

    if (propertiesError) {
        return { data: [], error: propertiesError };
    }

    const propertiesById = new Map(
        ((propertiesData || []) as PropertyRow[]).map((property) => [property.id, property])
    );

    const orderedProperties = propertyIds
        .map((propertyId) => propertiesById.get(propertyId) || null)
        .filter((property): property is PropertyRow => property !== null);

    return { data: orderedProperties, error: null };
}

export function createPropertyService(deps: PropertyServiceDependencies) {
    async function createFullProperty(
        propertyData: PropertyInsert,
        imageFiles: File[],
        userId: string
    ): Promise<PropertyRow> {
        if (isMockModeEnabled()) {
            const newProp: PropertyRow = {
                ...propertyData,
                id: Math.random().toString(36).substr(2, 9),
                owner_id: userId,
                images: await deps.uploadPropertyImages(imageFiles, userId),
                status: 'pending',
                is_verified: false,
                views_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            MOCK_PROPERTIES.unshift(newProp);
            return newProp;
        }

        try {
            let imageUrls: string[] = [];
            if (imageFiles.length > 0) {
                imageUrls = await deps.uploadPropertyImages(imageFiles, userId);
            }

            const { data, error } = await supabase
                .from('properties')
                .insert({
                    ...propertyData,
                    owner_id: userId,
                    images: imageUrls,
                    status: 'pending',
                })
                .select()
                .single();

            if (error) {
                for (const url of imageUrls) {
                    await deps.deletePropertyImage(url);
                }
                throw new Error(`ظپط´ظ„ ط­ظپط¸ ط§ظ„ط¹ظ‚ط§ط±: ${error.message}`);
            }

            return data as PropertyRow;
        } catch (error) {
            console.error('Error in createFullProperty:', error);
            throw error;
        }
    }

    async function getProperties(filters?: {
        status?: string;
        category?: string;
        area?: string;
        minPrice?: number;
        maxPrice?: number;
        bedrooms?: number;
        bathrooms?: number;
        features?: string[];
        ownerId?: string;
        q?: string;
        limit?: number;
        offset?: number;
    }): Promise<PropertyRow[]> {
        if (isMockModeEnabled()) {
            let filtered = [...MOCK_PROPERTIES];
            if (filters?.status) filtered = filtered.filter((p) => p.status === filters.status);
            if (filters?.category) filtered = filtered.filter((p) => p.category === filters.category);
            if (filters?.area && filters.area !== 'ط§ظ„ظƒظ„') filtered = filtered.filter((p) => p.area === filters.area);
            if (filters?.minPrice) filtered = filtered.filter((p) => p.price >= filters.minPrice!);
            if (filters?.maxPrice) filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
            if (filters?.bedrooms) filtered = filtered.filter((p) => (p.bedrooms || 0) >= filters.bedrooms!);
            if (filters?.bathrooms) filtered = filtered.filter((p) => (p.bathrooms || 0) >= filters.bathrooms!);
            if (filters?.ownerId) filtered = filtered.filter((p) => p.owner_id === filters.ownerId);
            if (filters?.q) {
                const normalizedQuery = filters.q.trim().toLowerCase();
                filtered = filtered.filter((property) =>
                    property.title.toLowerCase().includes(normalizedQuery) ||
                    (property.address || '').toLowerCase().includes(normalizedQuery) ||
                    (property.area || '').toLowerCase().includes(normalizedQuery),
                );
            }
            if (typeof filters?.offset === 'number' || typeof filters?.limit === 'number') {
                const start = Math.max(filters?.offset ?? 0, 0);
                const end = typeof filters?.limit === 'number' ? start + filters.limit : undefined;
                filtered = filtered.slice(start, end);
            }
            return filtered;
        }

        let query = supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.category) query = query.eq('category', filters.category);
        if (filters?.area && filters.area !== 'ط§ظ„ظƒظ„') query = query.eq('area', filters.area);
        if (filters?.minPrice) query = query.gte('price', filters.minPrice);
        if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);
        if (filters?.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
        if (filters?.bathrooms) query = query.gte('bathrooms', filters.bathrooms);
        if (filters?.features && filters.features.length > 0) query = query.contains('features', filters.features);
        if (filters?.ownerId) query = query.eq('owner_id', filters.ownerId);
        if (filters?.q?.trim()) {
            const searchQuery = filters.q.trim();
            query = query.or(`title.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,area.ilike.%${searchQuery}%`);
        }
        if (typeof filters?.limit === 'number') {
            const offset = Math.max(filters.offset ?? 0, 0);
            query = query.range(offset, offset + filters.limit - 1);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching properties:', error);
            return [];
        }
        return (data || []) as PropertyRow[];
    }

    async function getPropertiesCount(filters?: { ownerId?: string }): Promise<number> {
        if (isMockModeEnabled()) {
            let filtered = [...MOCK_PROPERTIES];
            if (filters?.ownerId) filtered = filtered.filter((p) => p.owner_id === filters.ownerId);
            return filtered.length;
        }

        let query = supabase
            .from('properties')
            .select('*', { count: 'exact', head: true });

        if (filters?.ownerId) query = query.eq('owner_id', filters.ownerId);

        const { count, error } = await query;
        if (error) {
            console.error('Error fetching properties count:', error);
            return 0;
        }
        return count || 0;
    }

    async function getPropertyById(id: string): Promise<PropertyRow | null> {
        if (isMockModeEnabled()) {
            return MOCK_PROPERTIES.find((p) => p.id === id) || null;
        }

        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching property:', { id, error });
            return null;
        }
        return (data as PropertyRow | null) || null;
    }

    async function incrementPropertyViews(id: string): Promise<void> {
        if (isMockModeEnabled()) return;

        const { error } = await supabase.rpc('increment_views', { property_id: id });
        if (error) {
            const property = await getPropertyById(id);
            if (property) {
                await supabase
                    .from('properties')
                    .update({ views_count: property.views_count + 1 })
                    .eq('id', id);
            }
        }
    }

    async function updateProperty(id: string, updates: Partial<PropertyRow>): Promise<PropertyRow | null> {
        if (isMockModeEnabled()) {
            const idx = MOCK_PROPERTIES.findIndex((p) => p.id === id);
            if (idx !== -1) {
                MOCK_PROPERTIES[idx] = { ...MOCK_PROPERTIES[idx], ...updates };
                return MOCK_PROPERTIES[idx];
            }
            return null;
        }

        const { data, error } = await supabase
            .from('properties')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating property:', error);
            return null;
        }
        return data as PropertyRow;
    }

    async function deleteProperty(id: string): Promise<boolean> {
        if (isMockModeEnabled()) {
            const idx = MOCK_PROPERTIES.findIndex((p) => p.id === id);
            if (idx !== -1) {
                MOCK_PROPERTIES.splice(idx, 1);
                return true;
            }
            return false;
        }

        const property = await getPropertyById(id);
        if (property?.images && property.images.length > 0) {
            await Promise.all(property.images.map((url) => deps.deletePropertyImage(url)));
        }

        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);

        return !error;
    }

    async function getFavorites(userId: string): Promise<{ data: PropertyRow[]; error: any }> {
        if (isMockModeEnabled()) {
            const favoriteProperties = Array.from(_mockFavorites)
                .map((id) => MOCK_PROPERTIES.find((property) => property.id === id) || null)
                .filter((property): property is PropertyRow => property !== null);

            return { data: favoriteProperties, error: null };
        }

        try {
            const { data, error } = await supabase
                .rpc('get_user_favorites', { uid: userId });

            if (error) {
                if (isMissingRpcFunctionError(error, 'get_user_favorites')) {
                    return await getFavoritesFallback(userId);
                }

                console.error('[getFavorites RPC Error]', error);
                return { data: [], error };
            }

            return { data: (data || []) as PropertyRow[], error: null };
        } catch (error) {
            if (isMissingRpcFunctionError(error, 'get_user_favorites')) {
                return await getFavoritesFallback(userId);
            }

            console.error('[getFavorites Unexpected Error]', error);
            return { data: [], error };
        }
    }

    async function toggleFavorite(userId: string, propertyId: string): Promise<boolean> {
        if (isMockModeEnabled()) {
            if (_mockFavorites.has(propertyId)) {
                _mockFavorites.delete(propertyId);
                return false;
            }

            _mockFavorites.add(propertyId);
            return true;
        }

        const { data: existing } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .eq('property_id', propertyId)
            .single();

        if (existing) {
            await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('property_id', propertyId);
            return false;
        }

        await supabase
            .from('favorites')
            .insert({ user_id: userId, property_id: propertyId });
        return true;
    }

    async function getFavoritesCount(userId: string): Promise<number> {
        if (isMockModeEnabled()) {
            return Array.from(_mockFavorites).length;
        }

        const { count, error } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching favorites count:', error);
            return 0;
        }

        return count || 0;
    }

    async function getUnlockedProperties(userId: string): Promise<string[]> {
        if (isMockModeEnabled()) {
            return Array.from(_mockUnlocked);
        }

        const { data, error } = await supabase
            .from('unlocked_properties')
            .select('property_id')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching unlocked properties:', error);
            return [];
        }

        return data.map((u) => u.property_id);
    }

    async function getUnlockedPropertiesCount(userId: string): Promise<number> {
        if (isMockModeEnabled()) {
            return Array.from(_mockUnlocked).length;
        }

        const { count, error } = await supabase
            .from('unlocked_properties')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching unlocked properties count:', error);
            return 0;
        }

        return count || 0;
    }

    async function isPropertyUnlocked(userId: string, propertyId: string): Promise<boolean> {
        if (isMockModeEnabled()) {
            return _mockUnlocked.has(propertyId);
        }

        const { data } = await supabase
            .from('unlocked_properties')
            .select('*')
            .eq('user_id', userId)
            .eq('property_id', propertyId)
            .single();

        return !!data;
    }

    async function getReviewsForProperty(propertyId: string): Promise<{
        id: string;
        user_id: string;
        rating: number;
        comment: string | null;
        created_at: string;
    }[]> {
        if (isMockModeEnabled()) {
            return [
                {
                    id: 'review-1',
                    user_id: 'user-2',
                    rating: 5,
                    comment: 'ط¹ظ‚ط§ط± ظ…ظ…طھط§ط² ظˆظ†ط¸ظٹظپ ط¬ط¯ط§ظ‹طŒ ظˆط§ظ„ظ…ط§ظ„ظƒ ظ…طھط¹ط§ظˆظ†.',
                    created_at: new Date().toISOString()
                }
            ];
        }

        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
        return data || [];
    }

    async function addReview(params: {
        propertyId: string;
        userId: string;
        rating: number;
        comment?: string;
    }): Promise<void> {
        if (isMockModeEnabled()) {
            return;
        }

        const { error } = await supabase
            .from('reviews')
            .insert({
                property_id: params.propertyId,
                user_id: params.userId,
                rating: params.rating,
                comment: params.comment,
            });

        if (error) {
            throw new Error(`ظپط´ظ„ ط¥ط¶ط§ظپط© ط§ظ„طھظ‚ظٹظٹظ…: ${error.message}`);
        }
    }

    return {
        createFullProperty,
        getProperties,
        getPropertiesCount,
        getPropertyById,
        incrementPropertyViews,
        updateProperty,
        deleteProperty,
        getFavorites,
        toggleFavorite,
        getFavoritesCount,
        getUnlockedProperties,
        getUnlockedPropertiesCount,
        isPropertyUnlocked,
        getReviewsForProperty,
        addReview,
    };
}
