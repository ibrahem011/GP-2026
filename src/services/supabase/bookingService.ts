import type { Booking, PublicBookingPeriod, RentalConfig, TenantPropertyState } from '@/types';
import { isMockModeEnabled, supabase } from './client';
import { _mockUnlocked } from './mockData';
import type {
    TenantPropertyBookingRow,
    UserBookingsFallbackRow,
    UserBookingsRpcRow,
} from './types';
import {
    buildBookingSystemMessage,
    coerceSingleRelation,
    isMissingRpcFunctionError,
    normalizeDateOnly,
} from './utils';

type BookingServiceDependencies = {
    createConversation: (params: {
        propertyId: string;
        buyerId: string;
        ownerId: string;
    }) => Promise<string>;
    sendMessage: (params: {
        conversationId: string;
        senderId: string;
        text?: string;
        messageType?: 'text' | 'voice' | 'image' | 'system';
        mediaUrl?: string;
        duration?: number;
        metadata?: any;
    }) => Promise<void>;
};

const PUBLIC_BOOKING_PERIODS_RPC_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_BOOKING_PERIODS_RPC === 'true';
let publicBookingPeriodsRpcAvailable = PUBLIC_BOOKING_PERIODS_RPC_ENABLED;

function mapFallbackBookingRow(
    row: UserBookingsFallbackRow,
    bookingType: 'tenant' | 'owner'
) {
    const property = coerceSingleRelation(row.property);
    const user = coerceSingleRelation(row.user);

    return {
        id: row.id,
        propertyId: row.property_id,
        userId: row.user_id,
        startDate: row.start_date,
        endDate: row.end_date,
        totalAmount: row.total_amount,
        status: row.status,
        createdAt: row.created_at,
        tenantName: row.tenant_name,
        bookingType,
        property: {
            id: property?.id || null,
            title: property?.title || null,
            images: property?.images || [],
            area: property?.area || null,
            ownerId: property?.owner_id || null,
            ownerName: property?.owner_name || null,
            ownerPhone: property?.owner_phone || null,
        },
        user: bookingType === 'owner'
            ? {
                id: user?.id || row.user_id,
                fullName: user?.full_name || row.tenant_name,
                avatarUrl: user?.avatar_url || null,
            }
            : null,
    };
}

async function getUserBookingsFallback(userId: string): Promise<{ bookings: any[]; error: any }> {
    // ⚡ Bolt: Parallelize independent database queries for faster loading
    const [
        { data: tenantRows, error: tenantError },
        { data: ownerRows, error: ownerError }
    ] = await Promise.all([
        supabase
            .from('bookings')
            .select(`
                id,
                property_id,
                user_id,
                start_date,
                end_date,
                total_amount,
                status,
                created_at,
                tenant_name,
                property:properties (
                    id,
                    title,
                    images,
                    area,
                    owner_id,
                    owner_name,
                    owner_phone
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        supabase
            .from('bookings')
            .select(`
                id,
                property_id,
                user_id,
                start_date,
                end_date,
                total_amount,
                status,
                created_at,
                tenant_name,
                property:properties!inner (
                    id,
                    title,
                    images,
                    area,
                    owner_id,
                    owner_name,
                    owner_phone
                ),
                user:profiles (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq('property.owner_id', userId)
            .order('created_at', { ascending: false })
    ]);

    if (tenantError) {
        return { bookings: [], error: tenantError };
    }

    if (ownerError) {
        return { bookings: [], error: ownerError };
    }

    const bookings = [
        ...((tenantRows || []) as UserBookingsFallbackRow[]).map((row) => mapFallbackBookingRow(row, 'tenant')),
        ...((ownerRows || []) as UserBookingsFallbackRow[]).map((row) => mapFallbackBookingRow(row, 'owner')),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { bookings, error: null };
}

export function createBookingService(deps: BookingServiceDependencies) {
    async function getPublicBookingPeriods(propertyId: string): Promise<PublicBookingPeriod[]> {
        if (isMockModeEnabled()) {
            return [];
        }

        if (!publicBookingPeriodsRpcAvailable) {
            return [];
        }

        const { data, error } = await supabase.rpc('get_public_property_booking_periods', {
            p_property_id: propertyId,
        });

        if (error) {
            const rpcError = error as {
                code?: string;
                message?: string;
                details?: string;
                hint?: string;
            };

            const isMissingRpc =
                rpcError.code === 'PGRST202' ||
                rpcError.code === '404' ||
                rpcError.message?.includes('get_public_property_booking_periods') ||
                rpcError.details?.includes('get_public_property_booking_periods') ||
                rpcError.hint?.includes('get_public_property_booking_periods');

            if (isMissingRpc) {
                publicBookingPeriodsRpcAvailable = false;
            }

            if (!isMissingRpc) {
                console.error('Error fetching public booking periods:', {
                    code: rpcError.code,
                    message: rpcError.message,
                    details: rpcError.details,
                    hint: rpcError.hint,
                });
            }

            return [];
        }

        return ((data || []) as Array<{ start_date: string; end_date: string }>).map((period) => ({
            startDate: period.start_date,
            endDate: period.end_date,
        }));
    }

    async function getTenantPropertyState(userId: string, propertyId: string): Promise<TenantPropertyState> {
        if (isMockModeEnabled()) {
            return {
                unlockedAt: _mockUnlocked.has(propertyId) ? new Date().toISOString() : null,
                unlockRequestStatus: _mockUnlocked.has(propertyId) ? 'approved' : 'none',
                latestBooking: null,
                hasBookingHistory: false,
            };
        }

        const [
            { data: unlockData, error: unlockError },
            { data: bookingData, error: bookingError },
            { data: paymentData, error: paymentError },
        ] = await Promise.all([
            supabase
                .from('unlocked_properties')
                .select('unlocked_at')
                .eq('user_id', userId)
                .eq('property_id', propertyId)
                .maybeSingle(),
            supabase
                .from('bookings')
                .select('id, start_date, end_date, status, created_at')
                .eq('user_id', userId)
                .eq('property_id', propertyId)
                .order('created_at', { ascending: false })
                .limit(1),
            supabase
                .from('payment_requests')
                .select('status')
                .eq('user_id', userId)
                .eq('property_id', propertyId)
                .order('created_at', { ascending: false })
                .limit(1),
        ]);

        if (unlockError) {
            console.error('Error fetching unlocked property state:', unlockError);
        }

        if (bookingError) {
            console.error('Error fetching tenant booking state:', bookingError);
        }

        if (paymentError) {
            console.error('Error fetching unlock payment state:', paymentError);
        }

        const latestBookingRow = ((bookingData || [])[0] || null) as TenantPropertyBookingRow | null;
        const latestPaymentStatus = ((paymentData || [])[0] as { status?: 'pending' | 'approved' | 'rejected' } | undefined)?.status;

        return {
            unlockedAt: unlockData?.unlocked_at || null,
            unlockRequestStatus: latestPaymentStatus || 'none',
            latestBooking: latestBookingRow
                ? {
                    id: latestBookingRow.id,
                    startDate: latestBookingRow.start_date,
                    endDate: latestBookingRow.end_date,
                    status: latestBookingRow.status,
                    createdAt: latestBookingRow.created_at,
                }
                : null,
            hasBookingHistory: Boolean(latestBookingRow),
        };
    }

    function calculateTotalPrice(
        rentalConfig: RentalConfig,
        startDate: Date,
        endDate: Date
    ): {
        basePrice: number;
        serviceFee: number;
        depositAmount: number;
        totalAmount: number;
        duration: number;
    } {
        const { type, pricePerUnit, seasonalConfig } = rentalConfig;
        let duration = 0;
        let basePrice = 0;
        let depositAmount = 0;

        switch (type) {
            case 'daily':
                duration = Math.ceil(
                    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                basePrice = duration * pricePerUnit;
                break;

            case 'monthly':
                const days = Math.ceil(
                    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                duration = Math.ceil(days / 30);
                basePrice = duration * pricePerUnit;
                break;

            case 'seasonal':
                duration = 10;
                basePrice = duration * pricePerUnit;

                if (seasonalConfig?.requiresDeposit) {
                    depositAmount = seasonalConfig.depositAmount || pricePerUnit;
                }
                break;
        }

        const SERVICE_FEE_PERCENTAGE = 0.1;
        const serviceFee = basePrice * SERVICE_FEE_PERCENTAGE;
        const totalAmount = basePrice + serviceFee + depositAmount;

        return {
            basePrice,
            serviceFee,
            depositAmount,
            totalAmount,
            duration,
        };
    }

    async function checkAvailability(
        propertyId: string,
        startDate: string,
        endDate: string
    ): Promise<{ available: boolean; error: any }> {
        const { validateUUID } = await import('@/utils/validation');

        const normalizedStart = normalizeDateOnly(startDate);
        const normalizedEnd = normalizeDateOnly(endDate);

        if (!normalizedStart || !normalizedEnd) {
            return { available: false, error: { message: 'صيغة التاريخ غير صالحة' } };
        }

        if (normalizedStart >= normalizedEnd) {
            return { available: false, error: { message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية' } };
        }

        if (isMockModeEnabled()) {
            return { available: true, error: null };
        }

        if (!validateUUID(propertyId)) {
            return { available: false, error: { message: 'معرف العقار غير صالح' } };
        }

        const { data, error } = await supabase
            .from('bookings')
            .select('id')
            .eq('property_id', propertyId)
            .in('status', ['confirmed', 'active'])
            .gt('end_date', normalizedStart)
            .lt('start_date', normalizedEnd)
            .limit(1);

        return {
            available: !data || data.length === 0,
            error,
        };
    }

    async function createBooking(bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<{
        data: Booking | null;
        error: any;
    }> {
        if (isMockModeEnabled()) {
            const normalizedStart = normalizeDateOnly(bookingData.startDate) || bookingData.startDate;
            const normalizedEnd = normalizeDateOnly(bookingData.endDate) || bookingData.endDate;

            const mockBooking: Booking = {
                ...bookingData,
                startDate: normalizedStart,
                endDate: normalizedEnd,
                id: `BK-${Date.now()}`,
                createdAt: new Date().toISOString(),
            };

            return { data: mockBooking, error: null };
        }

        const { validateUUID } = await import('@/utils/validation');

        const normalizedStart = normalizeDateOnly(bookingData.startDate);
        const normalizedEnd = normalizeDateOnly(bookingData.endDate);

        if (!validateUUID(bookingData.userId)) {
            return { data: null, error: { message: 'معرف المستخدم غير صالح' } };
        }

        if (!normalizedStart || !normalizedEnd) {
            return { data: null, error: { message: 'صيغة التاريخ غير صالحة' } };
        }

        if (normalizedStart >= normalizedEnd) {
            return { data: null, error: { message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية' } };
        }

        const safeBookingData = {
            ...bookingData,
            startDate: normalizedStart,
            endDate: normalizedEnd,
        };

        const { data, error } = await supabase
            .from('bookings')
            .insert({
                property_id: safeBookingData.propertyId,
                user_id: safeBookingData.userId,
                start_date: safeBookingData.startDate,
                end_date: safeBookingData.endDate,
                total_nights: safeBookingData.totalNights,
                total_months: safeBookingData.totalMonths,
                rental_type: safeBookingData.rentalType,
                tenant_name: safeBookingData.tenantName,
                tenant_phone: safeBookingData.tenantPhone,
                tenant_email: safeBookingData.tenantEmail,
                base_price: safeBookingData.basePrice,
                service_fee: safeBookingData.serviceFee,
                deposit_amount: safeBookingData.depositAmount,
                total_amount: safeBookingData.totalAmount,
                payment_method: safeBookingData.paymentMethod,
                payment_status: safeBookingData.paymentStatus,
                payment_proof: safeBookingData.paymentProof,
                status: safeBookingData.status,
            })
            .select()
            .single();

        if (error) {
            return { data: null, error };
        }

        const booking: Booking = {
            id: data.id,
            propertyId: data.property_id,
            userId: data.user_id,
            startDate: data.start_date,
            endDate: data.end_date,
            totalNights: data.total_nights,
            totalMonths: data.total_months,
            rentalType: data.rental_type,
            tenantName: data.tenant_name,
            tenantPhone: data.tenant_phone,
            tenantEmail: data.tenant_email,
            basePrice: data.base_price,
            serviceFee: data.service_fee,
            depositAmount: data.deposit_amount,
            totalAmount: data.total_amount,
            paymentMethod: data.payment_method,
            paymentStatus: data.payment_status,
            paymentProof: data.payment_proof,
            status: data.status,
            createdAt: data.created_at,
            confirmedAt: data.confirmed_at,
        };

        try {
            const { data: propertyOwner, error: propertyOwnerError } = await supabase
                .from('properties')
                .select('owner_id')
                .eq('id', booking.propertyId)
                .maybeSingle();

            if (propertyOwnerError) {
                throw propertyOwnerError;
            }

            if (propertyOwner?.owner_id) {
                const conversationId = await deps.createConversation({
                    propertyId: booking.propertyId,
                    buyerId: booking.userId,
                    ownerId: propertyOwner.owner_id,
                });

                const { data: existingBookingRequest, error: existingBookingRequestError } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('conversation_id', conversationId)
                    .eq('message_type', 'system')
                    .contains('metadata', {
                        type: 'booking_request',
                        booking_id: booking.id,
                    })
                    .limit(1);

                if (existingBookingRequestError) {
                    throw existingBookingRequestError;
                }

                if (!existingBookingRequest || existingBookingRequest.length === 0) {
                    const messageText = buildBookingSystemMessage(booking.startDate, booking.endDate);

                    await deps.sendMessage({
                        conversationId,
                        senderId: booking.userId,
                        text: messageText,
                        messageType: 'system',
                        metadata: {
                            type: 'booking_request',
                            booking_id: booking.id,
                            start_date: booking.startDate,
                            end_date: booking.endDate,
                            text: messageText,
                        },
                    });
                }
            }
        } catch (messageError) {
            console.error('Error sending booking_request message:', messageError);
        }

        return { data: booking, error: null };
    }

    async function getUserBookingsLegacy(userId: string): Promise<{
        data: Booking[];
        error: any;
    }> {
        if (isMockModeEnabled()) {
            return { data: [], error: null };
        }

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                property:properties(title, images, location, address)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            return { data: [], error };
        }

        const bookings: Booking[] = (data || []).map((item: any) => ({
            id: item.id,
            propertyId: item.property_id,
            userId: item.user_id,
            startDate: item.start_date,
            endDate: item.end_date,
            totalNights: item.total_nights,
            totalMonths: item.total_months,
            rentalType: item.rental_type,
            tenantName: item.tenant_name,
            tenantPhone: item.tenant_phone,
            tenantEmail: item.tenant_email,
            basePrice: item.base_price,
            serviceFee: item.service_fee,
            depositAmount: item.deposit_amount,
            totalAmount: item.total_amount,
            paymentMethod: item.payment_method,
            paymentStatus: item.payment_status,
            paymentProof: item.payment_proof,
            status: item.status,
            createdAt: item.created_at,
            confirmedAt: item.confirmed_at,
            property: item.property,
        }));

        return { data: bookings, error: null };
    }

    async function getUserBookings(userId: string): Promise<{ bookings: any[]; error: any }> {
        if (isMockModeEnabled()) {
            return { bookings: [], error: null };
        }

        try {
            const { data, error } = await supabase
                .rpc('get_user_bookings', { uid: userId });

            if (error) {
                if (isMissingRpcFunctionError(error, 'get_user_bookings')) {
                    return await getUserBookingsFallback(userId);
                }

                console.error('[getUserBookings RPC Error]', error);
                return { bookings: [], error };
            }

            const bookings = ((data || []) as UserBookingsRpcRow[]).map((row) => ({
                id: row.booking_id,
                propertyId: row.booking_property_id,
                userId: row.booking_user_id,
                startDate: row.start_date,
                endDate: row.end_date,
                totalAmount: row.total_amount,
                status: row.status,
                createdAt: row.created_at,
                tenantName: row.tenant_name,
                bookingType: row.booking_type,
                property: {
                    id: row.prop_id,
                    title: row.prop_title,
                    images: row.prop_images || [],
                    area: row.prop_area,
                    ownerId: row.prop_owner_id,
                    ownerName: row.prop_owner_name,
                    ownerPhone: row.prop_owner_phone,
                },
                user: row.booking_type === 'owner'
                    ? {
                        id: row.profile_id,
                        fullName: row.profile_full_name,
                        avatarUrl: row.profile_avatar_url,
                    }
                    : null,
            }));

            return { bookings, error: null };
        } catch (error: any) {
            if (isMissingRpcFunctionError(error, 'get_user_bookings')) {
                return await getUserBookingsFallback(userId);
            }

            console.error('[getUserBookings Unexpected Error]', error);
            return { bookings: [], error };
        }
    }

    async function getBookingById(bookingId: string): Promise<{
        data: Booking | null;
        error: any;
    }> {
        if (isMockModeEnabled()) {
            return { data: null, error: null };
        }

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                property:properties(*),
                user:profiles(full_name, phone, email)
            `)
            .eq('id', bookingId)
            .single();

        if (error) {
            return { data: null, error };
        }

        const booking: Booking = {
            id: data.id,
            propertyId: data.property_id,
            userId: data.user_id,
            startDate: data.start_date,
            endDate: data.end_date,
            totalNights: data.total_nights,
            totalMonths: data.total_months,
            rentalType: data.rental_type,
            tenantName: data.tenant_name,
            tenantPhone: data.tenant_phone,
            tenantEmail: data.tenant_email,
            basePrice: data.base_price,
            serviceFee: data.service_fee,
            depositAmount: data.deposit_amount,
            totalAmount: data.total_amount,
            paymentMethod: data.payment_method,
            paymentStatus: data.payment_status,
            paymentProof: data.payment_proof,
            status: data.status,
            createdAt: data.created_at,
            confirmedAt: data.confirmed_at,
            property: data.property,
            user: data.user,
        };

        return { data: booking, error: null };
    }

    async function updateBookingStatus(
        bookingId: string,
        status: string,
        paymentStatus?: string
    ): Promise<{ error: any }> {
        if (isMockModeEnabled()) {
            return { error: null };
        }

        const updates: any = { status };
        if (paymentStatus) {
            updates.payment_status = paymentStatus;
        }
        if (status === 'confirmed' || status === 'approved') {
            updates.confirmed_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('bookings')
            .update(updates)
            .eq('id', bookingId);

        return { error };
    }

    return {
        getPublicBookingPeriods,
        getTenantPropertyState,
        calculateTotalPrice,
        checkAvailability,
        createBooking,
        getUserBookingsLegacy,
        getUserBookings,
        getBookingById,
        updateBookingStatus,
    };
}
