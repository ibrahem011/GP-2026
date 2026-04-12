'use server';

import { getServiceRoleSupabaseClient } from '@/lib/serverSupabase';
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * دالة مساعدة للتحقق من الصلاحيات والتوكن باستخدام Service Role
 */
async function verifyAdminAuth(token: string) {
    const supabase = getServiceRoleSupabaseClient();
    if (!supabase) throw new Error('Service Role Client not configured');

    // 1. Verify token to get the calling user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        throw new Error('Unauthorized: Invalid or expired token');
    }

    // 2. Verify the caller is an admin
    const { data: profileRaw, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_admin, is_super_admin')
        .eq('id', user.id)
        .single();
    
    const profile = profileRaw as any;
    
    if (profileError || !profile) {
        throw new Error('Forbidden: Could not find user profile');
    }

    const isAdmin = profile.is_admin === true || profile.role === 'admin';
    const isSuperAdmin = profile.is_super_admin === true;

    if (!isAdmin && !isSuperAdmin) {
        throw new Error('Forbidden: You do not have admin access');
    }

    return { user, profile, supabase, isAdmin, isSuperAdmin };
}

/**
 * توثيق حركة داخل سجلات تدقيق النظام
 */
async function auditLogAction(
    supabase: any,
    actorUserId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata: any = {}
) {
    const { error } = await supabase.from('admin_audit_logs').insert({
        actor_user_id: actorUserId,
        action,
        target_type: targetType,
        target_id: targetId,
        metadata
    });

    if (error) {
        console.error('Audit Log failed:', error);
        // We log it but do not throw to avoid crashing the main operation
    }
}

/**
 * تحديث حالة مستخدم من إدارة النظام
 */
export async function updateAdminUserState(
    token: string,
    targetUserId: string,
    updates: {
        is_admin?: boolean;
        is_blocked?: boolean;
        blocked_reason?: string | null;
        is_super_admin?: boolean;
    }
) {
    try {
        const { user, profile, supabase, isSuperAdmin } = await verifyAdminAuth(token);

        // Security check: Only super_admin can set/remove super_admin flag
        if (updates.is_super_admin !== undefined && !isSuperAdmin) {
            return { success: false, error: 'Only Super Admins can manage Super Admin roles' };
        }

        // Security check: cannot block or demote yourself
        if (targetUserId === user.id && (updates.is_blocked || updates.is_admin === false || updates.is_super_admin === false)) {
            return { success: false, error: 'You cannot perform this action on yourself' };
        }

        // Apply profile updates
        const updatePayload: Database['public']['Tables']['profiles']['Update'] = { ...updates };
        if (updates.is_blocked) {
            updatePayload.blocked_at = new Date().toISOString();
        } else if (updates.is_blocked === false) {
            updatePayload.blocked_at = null;
            updatePayload.blocked_reason = null;
        }

        const { error: updateError } = await supabase
            .from('profiles')
            // @ts-expect-error Generic type inference failure for profiles Update
            .update(updatePayload)
            .eq('id', targetUserId);

        if (updateError) {
            console.error('Failed to update user state:', updateError);
            return { success: false, error: updateError.message };
        }

        // Create log entry
        await auditLogAction(supabase, user.id, 'UPDATE_USER_STATE', 'profiles', targetUserId, updates);

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * الحذف النهائي للمستخدم 
 */
export async function hardDeleteUser(token: string, targetUserId: string) {
    try {
        const { user, supabase, isSuperAdmin } = await verifyAdminAuth(token);

        // Security check: Only super_admin can perform hard deletes
        if (!isSuperAdmin) {
            return { success: false, error: 'Only Super Admins can perform hard deletes' };
        }

        if (targetUserId === user.id) {
            return { success: false, error: 'You cannot delete yourself' };
        }

        // Call Supabase Auth Admin API to delete the user completely
        // This will cascade to profiles due to the ON DELETE CASCADE constraint in PostgreSQL
        const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUserId);

        if (deleteError) {
            console.error('Failed to delete user:', deleteError);
            return { success: false, error: deleteError.message };
        }

        await auditLogAction(supabase, user.id, 'HARD_DELETE_USER', 'auth.users', targetUserId, { deleted_at: new Date().toISOString() });

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * اعتماد أو رفض عقار من قبل الإدارة
 */
export async function updateAdminPropertyStatus(
    token: string,
    propertyId: string,
    status: 'active' | 'rejected' | 'pending',
    reason?: string
) {
    try {
        const { user, supabase } = await verifyAdminAuth(token);

        const updatePayload: any = { status };
        // We could theoretically add rejection_reason if the schema supports it.

        const { error: updateError } = await supabase
            .from('properties')
            // @ts-expect-error Generic type inference failure
            .update(updatePayload)
            .eq('id', propertyId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        await auditLogAction(supabase, user.id, 'UPDATE_PROPERTY_STATUS', 'properties', propertyId, { status, reason });

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * اعتماد مدفوعات المعاملات
 */
export async function updateAdminPaymentStatus(
    token: string,
    paymentId: string,
    status: 'approved' | 'rejected' | 'failed' | 'completed',
    metadata?: any
) {
    try {
        const { user, supabase } = await verifyAdminAuth(token);

        const { error: updateError } = await supabase
            .from('payments')
            // @ts-expect-error
            .update({ status })
            .eq('id', paymentId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        await auditLogAction(supabase, user.id, 'UPDATE_PAYMENT_STATUS', 'payments', paymentId, { status, ...metadata });

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * جلب قائمة كافة المستأجرين أو الملاك لإدارة النظام
 */
export async function getAdminUsers(token: string) {
    try {
        const { supabase } = await verifyAdminAuth(token);

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * تحديث حالة حجز من خلال الإدارة
 */
export async function updateAdminBookingStatus(
    token: string,
    bookingId: string,
    status: 'confirmed' | 'rejected' | 'pending' | 'cancelled',
    reason?: string
) {
    try {
        const { user, supabase } = await verifyAdminAuth(token);

        // Uses postgres RPC if transitioning booking status via strict admin logic 
        // fallback to standard update if RPC doesn't exist yet natively
        const { error: updateError } = await supabase
            // @ts-expect-error RPC typed locally before db types generator runs
            .rpc('admin_transition_booking_status', { 
                p_booking_id: bookingId, 
                p_new_status: status, 
                p_reject_reason: reason 
            });
            
        if (updateError) {
            return { success: false, error: updateError.message };
        }

        // Audit log is already handled in the RPC, but we can log here too if we want.
        
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
