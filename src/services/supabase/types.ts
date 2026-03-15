import type { UserRole } from '@/types';
import type { PropertyCategory, PriceUnit, PropertyStatus } from '@/types/database.types';

export interface UserProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    role: UserRole;
    is_verified: boolean;
    is_admin: boolean;
}

export interface PropertyInsert {
    title: string;
    description?: string;
    price: number;
    price_unit?: PriceUnit;
    category: PropertyCategory;
    location_lat?: number;
    location_lng?: number;
    address?: string;
    area?: string;
    bedrooms?: number;
    bathrooms?: number;
    floor_area?: number;
    floor_number?: number;
    features?: string[];
    owner_phone?: string;
    owner_name?: string;
}

export interface PropertyRow extends PropertyInsert {
    id: string;
    owner_id: string;
    status: PropertyStatus;
    images: string[];
    is_verified: boolean;
    views_count: number;
    created_at: string;
    updated_at: string;
}

export type UnlockablePayment = {
    id: string;
    amount: number;
    is_consumed: boolean | null;
};

export type TenantPropertyBookingRow = {
    id: string;
    start_date: string;
    end_date: string;
    status: 'pending' | 'requested' | 'confirmed' | 'active' | 'cancelled' | 'completed';
    created_at: string;
};

export type UserBookingsRpcRow = {
    booking_id: string;
    booking_property_id: string;
    booking_user_id: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    created_at: string;
    tenant_name: string | null;
    booking_type: 'tenant' | 'owner';
    prop_id: string | null;
    prop_title: string | null;
    prop_images: string[] | null;
    prop_area: string | null;
    prop_owner_id: string | null;
    prop_owner_name: string | null;
    prop_owner_phone: string | null;
    profile_id: string | null;
    profile_full_name: string | null;
    profile_avatar_url: string | null;
};

export type FavoriteReferenceRow = {
    property_id: string;
    created_at: string;
};

export type UserBookingsFallbackPropertyRow = {
    id: string;
    title: string | null;
    images: string[] | null;
    area: string | null;
    owner_id: string | null;
    owner_name: string | null;
    owner_phone: string | null;
};

export type UserBookingsFallbackUserRow = {
    id: string | null;
    full_name: string | null;
    avatar_url: string | null;
};

export type UserBookingsFallbackRow = {
    id: string;
    property_id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    created_at: string;
    tenant_name: string | null;
    property: UserBookingsFallbackPropertyRow | UserBookingsFallbackPropertyRow[] | null;
    user?: UserBookingsFallbackUserRow | UserBookingsFallbackUserRow[] | null;
};
