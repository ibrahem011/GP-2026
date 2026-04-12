import type { UserRole } from '@/types';

const ROLE_ALIASES: Record<string, UserRole> = {
    tenant: 'tenant',
    landlord: 'landlord',
    admin: 'admin',
    owner: 'landlord',
    user: 'tenant',
    'مستأجر': 'tenant',
    'مستاجر': 'tenant',
    'مؤجر': 'landlord',
    'موجر': 'landlord',
    'صاحب عقار': 'landlord',
    'مشرف': 'admin',
    'مدير': 'admin',
};

export const ROLE_LABELS_AR: Record<UserRole, string> = {
    tenant: 'مستأجر',
    landlord: 'مؤجر',
    admin: 'مسؤول',
};

export function normalizeRole(raw: string | null | undefined): UserRole {
    if (!raw) {
        return 'tenant';
    }

    const trimmed = raw.trim();
    const canonical = ROLE_ALIASES[trimmed] ?? ROLE_ALIASES[trimmed.toLowerCase()];

    if (canonical) {
        return canonical;
    }

    console.warn(`[roles] Unknown role "${raw}", defaulting to tenant`);
    return 'tenant';
}

export function toRoleLabel(roleLike: string | null | undefined): string {
    return ROLE_LABELS_AR[normalizeRole(roleLike)];
}

export function isAdminRole(roleLike: string | null | undefined, is_admin_flag?: boolean): boolean {
    return normalizeRole(roleLike) === 'admin' || is_admin_flag === true;
}

export function isLandlordRole(roleLike: string | null | undefined): boolean {
    return normalizeRole(roleLike) === 'landlord';
}

export function isTenantRole(roleLike: string | null | undefined): boolean {
    return normalizeRole(roleLike) === 'tenant';
}
