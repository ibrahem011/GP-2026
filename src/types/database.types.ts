// Supabase Database Types
// Schema-aligned: English enum values; use translation maps for UI.

export type PropertyCategory = 'apartment' | 'villa' | 'chalet' | 'studio' | 'room';
export type PriceUnit = 'day' | 'week' | 'month' | 'season';
export type PropertyStatus = 'pending' | 'available' | 'rented' | 'rejected';

/** Arabic labels for property category (UI) */
export const CATEGORY_AR: Record<PropertyCategory, string> = {
  apartment: 'شقة',
  villa: 'فيلا',
  chalet: 'شاليه',
  studio: 'استوديو',
  room: 'غرفة',
};

/** Arabic labels for price/booking unit (UI) */
export const PRICE_UNIT_AR: Record<PriceUnit, string> = {
  day: 'يوم',
  week: 'أسبوع',
  month: 'شهر',
  season: 'موسم',
};

/** Arabic labels for property status (UI) */
export const STATUS_AR: Record<PropertyStatus, string> = {
  available: 'متاح',
  pending: 'قيد المراجعة',
  rented: 'محجوز',
  rejected: 'مرفوض',
};

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    avatar_url: string | null;
                    phone: string | null;
                    role: 'tenant' | 'landlord' | 'admin';
                    is_verified: boolean;
                    is_admin: boolean;
                    is_super_admin: boolean;
                    is_blocked: boolean;
                    blocked_at: string | null;
                    blocked_reason: string | null;
                    archived_at: string | null;
                    archived_reason: string | null;
                    updated_at: string;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    phone?: string | null;
                    role?: 'tenant' | 'landlord' | 'admin';
                    is_verified?: boolean;
                    is_admin?: boolean;
                    is_super_admin?: boolean;
                    is_blocked?: boolean;
                    blocked_at?: string | null;
                    blocked_reason?: string | null;
                    archived_at?: string | null;
                    archived_reason?: string | null;
                    updated_at?: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    phone?: string | null;
                    role?: 'tenant' | 'landlord' | 'admin';
                    is_verified?: boolean;
                    is_admin?: boolean;
                    is_super_admin?: boolean;
                    is_blocked?: boolean;
                    blocked_at?: string | null;
                    blocked_reason?: string | null;
                    archived_at?: string | null;
                    archived_reason?: string | null;
                    updated_at?: string;
                    created_at?: string;
                };
            };
            properties: {
                Row: {
                    id: string;
                    owner_id: string;
                    title: string;
                    description: string | null;
                    price: number;
                    price_unit: PriceUnit;
                    category: PropertyCategory;
                    status: PropertyStatus;
                    location_lat: number | null;
                    location_lng: number | null;
                    address: string | null;
                    area: string | null;
                    bedrooms: number;
                    bathrooms: number;
                    floor_area: number | null;
                    floor_number: number;
                    features: string[];
                    images: string[];
                    owner_phone: string | null;
                    owner_name: string | null;
                    is_verified: boolean;
                    views_count: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    owner_id: string;
                    title: string;
                    description?: string | null;
                    price: number;
                    price_unit?: PriceUnit;
                    category: PropertyCategory;
                    status?: PropertyStatus;
                    location_lat?: number | null;
                    location_lng?: number | null;
                    address?: string | null;
                    area?: string | null;
                    bedrooms?: number;
                    bathrooms?: number;
                    floor_area?: number | null;
                    floor_number?: number;
                    features?: string[];
                    images?: string[];
                    owner_phone?: string | null;
                    owner_name?: string | null;
                    is_verified?: boolean;
                    views_count?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    owner_id?: string;
                    title?: string;
                    description?: string | null;
                    price?: number;
                    price_unit?: PriceUnit;
                    category?: PropertyCategory;
                    status?: PropertyStatus;
                    location_lat?: number | null;
                    location_lng?: number | null;
                    address?: string | null;
                    area?: string | null;
                    bedrooms?: number;
                    bathrooms?: number;
                    floor_area?: number | null;
                    floor_number?: number;
                    features?: string[];
                    images?: string[];
                    owner_phone?: string | null;
                    owner_name?: string | null;
                    is_verified?: boolean;
                    views_count?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            bookings: {
                Row: {
                    id: string;
                    property_id: string;
                    user_id: string;
                    start_date: string;
                    end_date: string;
                    total_nights: number;
                    total_months: number;
                    rental_type: 'daily' | 'monthly' | 'seasonal';
                    tenant_name: string | null;
                    tenant_phone: string | null;
                    tenant_email: string | null;
                    base_price: number | null;
                    service_fee: number | null;
                    deposit_amount: number | null;
                    total_price: number;
                    total_amount: number;
                    payment_method: 'vodafone_cash' | 'instapay' | 'cash_on_delivery' | null;
                    payment_status: 'pending' | 'confirmed' | 'failed' | null;
                    payment_proof: string | null;
                    status: 'pending' | 'requested' | 'confirmed' | 'active' | 'cancelled' | 'completed';
                    created_at: string;
                    confirmed_at: string | null;
                };
                Insert: {
                    id?: string;
                    property_id: string;
                    user_id: string;
                    start_date: string;
                    end_date: string;
                    total_nights?: number;
                    total_months?: number;
                    rental_type?: 'daily' | 'monthly' | 'seasonal';
                    tenant_name?: string | null;
                    tenant_phone?: string | null;
                    tenant_email?: string | null;
                    base_price?: number | null;
                    service_fee?: number | null;
                    deposit_amount?: number | null;
                    total_price?: number;
                    total_amount?: number;
                    payment_method?: 'vodafone_cash' | 'instapay' | 'cash_on_delivery' | null;
                    payment_status?: 'pending' | 'confirmed' | 'failed' | null;
                    payment_proof?: string | null;
                    status?: 'pending' | 'requested' | 'confirmed' | 'active' | 'cancelled' | 'completed';
                    created_at?: string;
                    confirmed_at?: string | null;
                };
                Update: {
                    id?: string;
                    property_id?: string;
                    user_id?: string;
                    start_date?: string;
                    end_date?: string;
                    total_nights?: number;
                    total_months?: number;
                    rental_type?: 'daily' | 'monthly' | 'seasonal';
                    tenant_name?: string | null;
                    tenant_phone?: string | null;
                    tenant_email?: string | null;
                    base_price?: number | null;
                    service_fee?: number | null;
                    deposit_amount?: number | null;
                    total_price?: number;
                    total_amount?: number;
                    payment_method?: 'vodafone_cash' | 'instapay' | 'cash_on_delivery' | null;
                    payment_status?: 'pending' | 'confirmed' | 'failed' | null;
                    payment_proof?: string | null;
                    status?: 'pending' | 'requested' | 'confirmed' | 'active' | 'cancelled' | 'completed';
                    created_at?: string;
                    confirmed_at?: string | null;
                };
            };
            payment_requests: {
                Row: {
                    id: string;
                    user_id: string;
                    property_id: string;
                    amount: number;
                    payment_method: 'vodafone_cash' | 'instapay' | 'fawry';
                    receipt_image: string | null;
                    status: 'pending' | 'approved' | 'rejected';
                    is_consumed: boolean;
                    admin_note: string | null;
                    processed_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    property_id: string;
                    amount: number;
                    payment_method: 'vodafone_cash' | 'instapay' | 'fawry';
                    receipt_image?: string | null;
                    status?: 'pending' | 'approved' | 'rejected';
                    is_consumed?: boolean;
                    admin_note?: string | null;
                    processed_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    property_id?: string;
                    amount?: number;
                    payment_method?: 'vodafone_cash' | 'instapay' | 'fawry';
                    receipt_image?: string | null;
                    status?: 'pending' | 'approved' | 'rejected';
                    is_consumed?: boolean;
                    admin_note?: string | null;
                    processed_at?: string | null;
                    created_at?: string;
                };
            };
            reviews: {
                Row: {
                    id: string;
                    property_id: string;
                    user_id: string;
                    rating: number;
                    comment: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    property_id: string;
                    user_id: string;
                    rating: number;
                    comment?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    property_id?: string;
                    user_id?: string;
                    rating?: number;
                    comment?: string | null;
                    created_at?: string;
                };
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    message: string | null;
                    type: 'success' | 'info' | 'warning' | 'error';
                    is_read: boolean;
                    link: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    message?: string | null;
                    type: 'success' | 'info' | 'warning' | 'error';
                    is_read?: boolean;
                    link?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    message?: string | null;
                    type?: 'success' | 'info' | 'warning' | 'error';
                    is_read?: boolean;
                    link?: string | null;
                    created_at?: string;
                };
            };
            favorites: {
                Row: {
                    user_id: string;
                    property_id: string;
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    property_id: string;
                    created_at?: string;
                };
                Update: {
                    user_id?: string;
                    property_id?: string;
                    created_at?: string;
                };
            };
            unlocked_properties: {
                Row: {
                    user_id: string;
                    property_id: string;
                    unlocked_at: string;
                };
                Insert: {
                    user_id: string;
                    property_id: string;
                    unlocked_at?: string;
                };
                Update: {
                    user_id?: string;
                    property_id?: string;
                    unlocked_at?: string;
                };
            };
            conversations: {
                Row: {
                    id: string;
                    property_id: string | null;
                    buyer_id: string;
                    owner_id: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    property_id?: string | null;
                    buyer_id: string;
                    owner_id: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    property_id?: string | null;
                    buyer_id?: string;
                    owner_id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            messages: {
                Row: {
                    id: string;
                    conversation_id: string;
                    sender_id: string | null;
                    text: string;
                    is_read: boolean;
                    created_at: string;
                    message_type: string | null;
                    media_url: string | null;
                    duration: number | null;
                    metadata: Json | null;
                };
                Insert: {
                    id?: string;
                    conversation_id: string;
                    sender_id?: string | null;
                    text: string;
                    is_read?: boolean;
                    created_at?: string;
                    message_type?: string | null;
                    media_url?: string | null;
                    duration?: number | null;
                    metadata?: Json | null;
                };
                Update: {
                    id?: string;
                    conversation_id?: string;
                    sender_id?: string | null;
                    text?: string;
                    is_read?: boolean;
                    created_at?: string;
                    message_type?: string | null;
                    media_url?: string | null;
                    duration?: number | null;
                    metadata?: Json | null;
                };
            };
            user_secrets: {
                Row: {
                    user_id: string;
                    national_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    national_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    user_id?: string;
                    national_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            system_settings: {
                Row: {
                    key: string;
                    value: Json;
                    description: string | null;
                    updated_at: string;
                };
                Insert: {
                    key: string;
                    value?: Json;
                    description?: string | null;
                    updated_at?: string;
                };
                Update: {
                    key?: string;
                    value?: Json;
                    description?: string | null;
                    updated_at?: string;
                };
            };
            admin_audit_logs: {
                Row: {
                    id: string;
                    action: string;
                    actor_user_id: string;
                    target_type: string;
                    target_id: string;
                    metadata: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    action: string;
                    actor_user_id: string;
                    target_type: string;
                    target_id: string;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    action?: string;
                    actor_user_id?: string;
                    target_type?: string;
                    target_id?: string;
                    metadata?: Json | null;
                    created_at?: string;
                };
            };
        };
        Views: Record<string, never>;
        Functions: {
            get_public_property_booking_periods: {
                Args: {
                    p_property_id: string;
                };
                Returns: {
                    end_date: string;
                    start_date: string;
                }[];
            };
            increment_views: {
                Args: {
                    property_id: string;
                };
                Returns: void;
            };
            unlock_property_with_payment: {
                Args: {
                    p_user_id: string;
                    p_property_id: string;
                    p_payment_id: string;
                };
                Returns: void;
            };
        };
        Enums: Record<string, never>;
    };
}

// Type aliases for easier use
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Property = Database['public']['Tables']['properties']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type PaymentRequest = Database['public']['Tables']['payment_requests']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type UnlockedProperty = Database['public']['Tables']['unlocked_properties']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
