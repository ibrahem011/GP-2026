import { isMockModeEnabled, supabase } from './client';
import { _mockUnlocked } from './mockData';
import type { UnlockablePayment } from './types';

const UNLOCK_FEE = 50;

async function getApprovedUnlockPayment(
    userId: string,
    propertyId: string,
    paymentId?: string
): Promise<UnlockablePayment> {
    let query = supabase
        .from('payment_requests')
        .select('id, amount, is_consumed')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .eq('status', 'approved')
        .or('is_consumed.eq.false,is_consumed.is.null');

    if (paymentId) {
        query = query.eq('id', paymentId);
    }

    const { data: rawPayment, error: paymentError } = await query.maybeSingle();
    const payment = rawPayment as UnlockablePayment | null;

    if (paymentError) {
        throw new Error(`ط®ط·ط£ ظپظٹ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¯ظپط¹: ${paymentError.message}`);
    }

    if (!payment) {
        throw new Error('ظ„ط§ ظٹظˆط¬ط¯ ط¯ظپط¹ ظ…ط¹طھظ…ط¯ ظ„ظ‡ط°ط§ ط§ظ„ط¹ظ‚ط§ط±');
    }

    if (payment.amount < UNLOCK_FEE) {
        throw new Error(
            `ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط¯ظپظˆط¹ (${payment.amount} ط¬ظ†ظٹظ‡) ط£ظ‚ظ„ ظ…ظ† ط§ظ„ط±ط³ظˆظ… ط§ظ„ظ…ط·ظ„ظˆط¨ط© (${UNLOCK_FEE} ط¬ظ†ظٹظ‡)`
        );
    }

    if (payment.is_consumed === null) {
        const { error: normalizeError } = await supabase
            .from('payment_requests')
            .update({ is_consumed: false })
            .eq('id', payment.id);

        if (normalizeError) {
            throw new Error(`Failed to normalize payment consumption state: ${normalizeError.message}`);
        }
    }

    return payment;
}

export function createPaymentService() {
    async function unlockProperty(userId: string, propertyId: string, paymentId?: string): Promise<void> {
        if (isMockModeEnabled()) {
            _mockUnlocked.add(propertyId);
            return;
        }

        if (!userId || !propertyId) {
            throw new Error('userId and propertyId are required');
        }

        try {
            const payment = await getApprovedUnlockPayment(userId, propertyId, paymentId);

            const { data: alreadyUnlocked } = await supabase
                .from('unlocked_properties')
                .select('property_id')
                .eq('user_id', userId)
                .eq('property_id', propertyId)
                .maybeSingle();

            if (alreadyUnlocked) {
                throw new Error('ط§ظ„ط¹ظ‚ط§ط± ظ…ظپطھظˆط­ ط¨ط§ظ„ظپط¹ظ„');
            }

            const { error: unlockError } = await supabase.rpc('unlock_property_with_payment', {
                p_user_id: userId,
                p_property_id: propertyId,
                p_payment_id: payment.id
            });

            if (unlockError) {
                throw new Error(`ظپط´ظ„ ظپطھط­ ط§ظ„ط¹ظ‚ط§ط±: ${unlockError.message}`);
            }

        } catch (error: any) {
            console.error('Error unlocking property:', error);
            throw error;
        }
    }

    async function approvePaymentAndUnlock(paymentId: string, userId: string, propertyId: string): Promise<void> {
        if (isMockModeEnabled()) {
            _mockUnlocked.add(propertyId);
            return;
        }

        if (!paymentId || !userId || !propertyId) {
            throw new Error('paymentId, userId, and propertyId are required');
        }

        try {
            const { data: existingPayment, error: existingPaymentError } = await supabase
                .from('payment_requests')
                .select('id, user_id, property_id, status, is_consumed')
                .eq('id', paymentId)
                .maybeSingle();

            if (existingPaymentError) {
                throw new Error(`Failed to load payment request before approval: ${existingPaymentError.message}`);
            }

            if (!existingPayment) {
                throw new Error('Payment request was not found before approval');
            }

            if (existingPayment.user_id !== userId || existingPayment.property_id !== propertyId) {
                throw new Error('Payment request data does not match the selected property');
            }

            const { error: approvalError } = await supabase
                .from('payment_requests')
                .update({
                    status: 'approved',
                    processed_at: new Date().toISOString(),
                    is_consumed: false,
                })
                .eq('id', paymentId);

            if (approvalError) {
                throw new Error(`Failed to approve payment request: ${approvalError.message}`);
            }

            const { data: approvedPayment, error: approvedPaymentError } = await supabase
                .from('payment_requests')
                .select('id, status')
                .eq('id', paymentId)
                .maybeSingle();

            if (approvedPaymentError) {
                throw new Error(`Failed to verify approved payment request: ${approvedPaymentError.message}`);
            }

            if (!approvedPayment || approvedPayment.status !== 'approved') {
                throw new Error('Payment request approval was not applied');
            }

            await unlockProperty(userId, propertyId, paymentId);
        } catch (error: any) {
            console.error('Error approving payment request:', error);
            throw error;
        }
    }

    async function createPaymentRequest(params: {
        userId: string;
        propertyId: string;
        amount: number;
        paymentMethod: 'vodafone_cash' | 'instapay' | 'fawry';
        receiptImage?: string;
    }): Promise<void> {
        if (isMockModeEnabled()) {
            return;
        }

        const { error } = await supabase
            .from('payment_requests')
            .insert({
                user_id: params.userId,
                property_id: params.propertyId,
                amount: params.amount,
                payment_method: params.paymentMethod,
                receipt_image: params.receiptImage,
            });

        if (error) {
            throw new Error(`ظپط´ظ„ ط¥ط±ط³ط§ظ„ ط·ظ„ط¨ ط§ظ„ط¯ظپط¹: ${error.message}`);
        }
    }

    async function getPaymentRequests(filters?: { status?: string }): Promise<any[]> {
        if (isMockModeEnabled()) {
            return [];
        }

        let query = supabase
            .from('payment_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching payment requests:', error);
            return [];
        }
        return data || [];
    }

    async function getPaymentRequestsCount(filters?: { status?: string }): Promise<number> {
        if (isMockModeEnabled()) {
            return 0;
        }

        let query = supabase
            .from('payment_requests')
            .select('*', { count: 'exact', head: true });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        const { count, error } = await query;
        if (error) {
            console.error('Error fetching payment requests count:', error);
            return 0;
        }
        return count || 0;
    }

    return {
        unlockProperty,
        approvePaymentAndUnlock,
        createPaymentRequest,
        getPaymentRequests,
        getPaymentRequestsCount,
    };
}
