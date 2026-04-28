import type { Booking } from '@/types';

export type BookingStatusUI =
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'unknown';

export function normalizeBookingStatus(status: string | null | undefined): BookingStatusUI {
    if (!status) {
        return 'unknown';
    }

    const normalized = status.toLowerCase();

    if (normalized === 'pending' || normalized === 'requested' || normalized === 'payment_pending' || normalized === 'payment_uploaded') {
        return 'pending';
    }

    if (normalized === 'confirmed' || normalized === 'approved' || normalized === 'active') {
        return 'confirmed';
    }

    if (normalized === 'completed') {
        return 'completed';
    }

    if (
        normalized === 'cancelled'
        || normalized === 'cancelled_by_tenant'
        || normalized === 'cancelled_by_landlord'
        || normalized === 'rejected'
        || normalized === 'expired'
        || normalized === 'disputed'
    ) {
        return 'cancelled';
    }

    return 'unknown';
}

export function getBookingStatusLabel(status: string | null | undefined): string {
    switch (normalizeBookingStatus(status)) {
        case 'pending':
            return 'قيد المراجعة';
        case 'confirmed':
            return 'مؤكد';
        case 'completed':
            return 'مكتمل';
        case 'cancelled':
            return 'ملغي';
        default:
            return 'غير معروف';
    }
}

export function getBookingStatusBadgeClass(status: string | null | undefined): string {
    switch (normalizeBookingStatus(status)) {
        case 'pending':
            return 'bg-amber-500 text-white';
        case 'confirmed':
            return 'bg-emerald-500 text-white';
        case 'completed':
            return 'bg-slate-500 text-white';
        case 'cancelled':
            return 'bg-rose-500 text-white';
        default:
            return 'bg-slate-400 text-white';
    }
}

export function getBookingStatusDescription(status: string | null | undefined): string {
    const normalized = status?.toLowerCase();

    if (normalized === 'requested') {
        return 'بانتظار قرار المؤجر';
    }

    if (normalized === 'pending') {
        return 'تم إنشاء الطلب ويجري مراجعته';
    }

    if (normalized === 'confirmed') {
        return 'تم قبول الحجز';
    }

    if (normalized === 'active') {
        return 'الحجز نشط حالياً';
    }

    if (normalized === 'completed') {
        return 'اكتملت مدة الحجز';
    }

    if (normalized === 'rejected') {
        return 'تم رفض الطلب';
    }

    if (normalized === 'cancelled' || normalized === 'cancelled_by_tenant' || normalized === 'cancelled_by_landlord') {
        return 'تم إلغاء الحجز';
    }

    if (normalized === 'expired') {
        return 'انتهت صلاحية الحجز';
    }

    return 'حالة الحجز غير معروفة';
}

export function formatPaymentMethod(method: Booking['paymentMethod'] | null | undefined): string {
    if (method === 'vodafone_cash') {
        return 'فودافون كاش';
    }

    if (method === 'instapay') {
        return 'إنستاباي';
    }

    if (method === 'cash_on_delivery') {
        return 'الدفع عند الاستلام';
    }

    return 'غير محدد';
}

export function formatPaymentStatus(status: Booking['paymentStatus'] | null | undefined): string {
    if (status === 'confirmed') {
        return 'تم التأكيد';
    }

    if (status === 'failed') {
        return 'فشل الدفع';
    }

    return 'بانتظار المراجعة';
}

export function calculateBookingDuration(booking: Pick<Booking, 'rentalType' | 'totalNights' | 'totalMonths' | 'startDate' | 'endDate'>): number {
    if (booking.rentalType === 'monthly' || booking.rentalType === 'seasonal') {
        return booking.totalMonths || 1;
    }

    if (booking.totalNights) {
        return booking.totalNights;
    }

    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
}

export function getBookingUnitPrice(booking: Pick<Booking, 'basePrice' | 'rentalType' | 'totalNights' | 'totalMonths' | 'startDate' | 'endDate'>): number {
    const duration = calculateBookingDuration(booking);
    if (!duration) {
        return booking.basePrice || 0;
    }

    return Math.round((booking.basePrice || 0) / duration);
}

export function canTenantCancelBooking(status: string | null | undefined): boolean {
    const normalized = status?.toLowerCase();
    return normalized === 'pending' || normalized === 'requested';
}

export function canLandlordRespondToBooking(status: string | null | undefined): boolean {
    const normalized = status?.toLowerCase();
    return normalized === 'pending' || normalized === 'requested';
}
