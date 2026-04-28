import type { PropertyCategory, PropertyStatus, PriceUnit } from './database.types';

export type { PropertyCategory, PropertyStatus, PriceUnit } from './database.types';
export { CATEGORY_AR, PRICE_UNIT_AR, STATUS_AR } from './database.types';

export type UserRole = 'tenant' | 'landlord' | 'admin';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export const ROLE_LANDLORD: UserRole = 'landlord';
export const ROLE_TENANT: UserRole = 'tenant';
export const ROLE_ADMIN: UserRole = 'admin';

export const ROLE_LABELS: Record<UserRole, string> = {
    tenant: 'مستأجر',
    landlord: 'مؤجر',
    admin: 'مسؤول',
};

export const isLandlord = (role: UserRole | undefined): boolean => role === 'landlord';
export const isTenant = (role: UserRole | undefined): boolean => role === 'tenant';
export const isAdmin = (role: UserRole | undefined): boolean => role === 'admin';

export interface Location {
    lat: number | null;
    lng: number | null;
    address: string;
    area: string;
}

export interface Property {
    id: string;
    title: string;
    description: string;
    price: number;
    priceUnit: PriceUnit;
    category: PropertyCategory;
    status: PropertyStatus;
    images: string[];
    location: Location;
    ownerPhone: string;
    ownerId: string;
    ownerName: string;
    features: string[];
    bedrooms: number;
    bathrooms: number;
    area: number;
    floor: number;
    isVerified: boolean;
    viewsCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
    role: UserRole;
    nationalId?: string;
    isVerified: boolean;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
    isBlocked?: boolean;
    blockedAt?: string;
    blockedReason?: string;
    archivedAt?: string;
    archivedReason?: string;
    favorites: string[];
    unlockedProperties: string[];
    createdAt: string;
    lastLogin?: string;
    memberSince: string;
}

export interface PaymentRequest {
    id: string;
    userId: string;
    userName: string;
    userPhone: string;
    propertyId: string;
    propertyTitle: string;
    amount: number;
    paymentMethod: 'vodafone_cash' | 'instapay' | 'fawry';
    receiptImage: string;
    status: PaymentStatus;
    adminNote?: string;
    createdAt: string;
    processedAt?: string;
}

export interface Review {
    id: string;
    propertyId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface Contract {
    id: string;
    propertyId: string;
    ownerId: string;
    tenantId: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    ownerSignature?: string;
    tenantSignature?: string;
    status: 'draft' | 'signed' | 'completed';
    createdAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    isRead: boolean;
    createdAt: string;
    link?: string;
}

export interface SearchFilters {
    query?: string;
    category?: PropertyCategory;
    minPrice?: number;
    maxPrice?: number;
    area?: string;
    bedrooms?: number;
    features?: string[];
    onlyVerified?: boolean;
}

export const AREAS = [
    'منطقة الكرنك',
    'منطقة البحر',
    'المركز',
    'الشاطئ الجديد',
    'منطقة السوق',
    'الحي الغربي',
    'الحي الشرقي',
] as const;

export const COMMISSION_AMOUNT = 50;
export const SERVICE_FEE_PERCENTAGE = 0.1;
export const VODAFONE_CASH_NUMBER = '01xxxxxxxxx';

export const GAMASA_CENTER = {
    lat: 31.4431,
    lng: 31.5344,
};

export const GAMASA_BOUNDS = {
    north: 31.47,
    south: 31.41,
    east: 31.58,
    west: 31.49,
};

export type RentalType = 'daily' | 'monthly' | 'seasonal';

export interface RentalConfig {
    type: RentalType;
    pricePerUnit: number;
    minDuration: number;
    maxDuration: number;
    seasonalConfig?: {
        startMonth: number;
        endMonth: number;
        requiresDeposit: boolean;
        depositAmount?: number;
    };
}

export interface Booking {
    id: string;
    propertyId: string;
    userId: string;
    startDate: string;
    endDate: string;
    totalNights?: number;
    totalMonths?: number;
    rentalType: RentalType;
    tenantName: string;
    tenantPhone: string;
    tenantEmail?: string;
    basePrice: number;
    serviceFee: number;
    depositAmount?: number;
    totalAmount: number;
    paymentMethod: 'vodafone_cash' | 'instapay' | 'cash_on_delivery';
    paymentStatus: 'pending' | 'confirmed' | 'failed';
    paymentProof?: string;
    status: 'pending' | 'requested' | 'confirmed' | 'active' | 'cancelled' | 'completed' | 'rejected' | 'expired';
    createdAt: string;
    confirmedAt?: string;
    landlordNote?: string;
    landlordNoteUpdatedAt?: string;
    property?: Property;
    user?: BookingPartyProfile | null;
}

export interface BookingPartyProfile {
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
}

export interface PublicBookingPeriod {
    startDate: string;
    endDate: string;
}

export interface TenantPropertyState {
    unlockedAt: string | null;
    unlockRequestStatus: 'none' | 'pending' | 'approved' | 'rejected';
    latestBooking: Pick<Booking, 'id' | 'startDate' | 'endDate' | 'status' | 'createdAt'> | null;
    hasBookingHistory: boolean;
}

export interface AdminAuditLog {
    id: string;
    action: string;
    actorUserId: string;
    targetType: string;
    targetId: string;
    metadata: any;
    createdAt: string;
}
