'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { useAuth } from '@/context/AuthContext';
import { supabaseService } from '@/services/supabaseService';
import { normalizeRole as normalizeRoleKey, toRoleLabel } from '@/lib/roles';

type Stats = {
    properties: number;
    unlocked: number;
    favorites: number;
};

type ProfileOverrides = {
    name: string;
    phone: string;
};

type UserLike = {
    id: string;
    name?: string | null;
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
    avatar?: string | null;
    avatar_url?: string | null;
    role?: string | null;
    isVerified?: boolean | null;
    is_verified?: boolean | null;
    isAdmin?: boolean | null;
    is_admin?: boolean | null;
    createdAt?: string | null;
    created_at?: string | null;
    memberSince?: string | null;
};

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth() as unknown as {
        user: UserLike | null;
        logout: () => void | Promise<void>;
        loading: boolean;
    };

    const [mounted, setMounted] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);

    // Lets the page reflect updated name/phone immediately after saving,
    // even if AuthContext refresh happens later.
    const [profileOverrides, setProfileOverrides] = useState<ProfileOverrides | null>(null);

    const [stats, setStats] = useState<Stats>({ properties: 0, unlocked: 0, favorites: 0 });
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [statsReloadKey, setStatsReloadKey] = useState(0);

    useEffect(() => setMounted(true), []);

    // Reset overrides when user changes (logout/login as another user)
    useEffect(() => {
        if (!user?.id) setProfileOverrides(null);
    }, [user?.id]);

    const u = useMemo(() => normalizeUser(user, profileOverrides), [user, profileOverrides]);
    const role = useMemo(() => getRolePresentation(u.role), [u.role]);

    useEffect(() => {
        if (!u.id) return;

        let cancelled = false;

        (async () => {
            setStatsLoading(true);
            setStatsError(null);

            try {
                const statsResult = await supabaseService.getProfileStats(u.id, {
                    timeoutMs: 8_000,
                    maxRetries: 0,
                    retryOnTimeout: false,
                    operationKey: 'profileStats',
                });

                if (cancelled) return;

                if (statsResult.error) {
                    throw statsResult.error;
                }

                setStats(statsResult.stats);
            } catch (e) {
                console.error(e);
                if (cancelled) return;
                setStatsError('تعذر تحميل الإحصائيات. حاول مرة أخرى.');
            } finally {
                if (!cancelled) setStatsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [u.id, statsReloadKey]);

    if (!mounted) return <ProfilePageSkeleton />;
    if (authLoading) return <ProfilePageSkeleton />;

    if (!user) {
        return <LoggedOutCTA />;
    }

    const isAdmin = role.key === 'admin';

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-28" dir="rtl">
            {/* Mobile Sticky Top Bar */}
            <div className="sm:hidden sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 px-4 h-14 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-zinc-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-[26px]">arrow_forward</span>
                </button>
                <span className="font-black text-gray-900 dark:text-white">الحساب</span>
                <div className="w-10" /> {/* Spacer */}
            </div>

            <div className="mx-auto w-full max-w-6xl px-4 pt-6 lg:pt-10">
                {/* Desktop Header with Back Button and Quick Actions */}
                <header className="hidden sm:flex flex-col gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-gray-500 hover:text-primary transition-colors focus:ring-2 focus:ring-primary/20"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                        <nav className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
                            <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                            <span className="text-gray-600 dark:text-gray-300">الحساب</span>
                        </nav>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white">الحساب</h1>
                            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                                إدارة بياناتك، مفضلاتك، وعقاراتك من مكان واحد بكل سهولة واحترافية.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                href="/add-property"
                                className="h-11 px-5 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                إضافة عقار
                            </Link>
                            <Link
                                href="/my-properties"
                                className="h-11 px-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 font-bold flex items-center gap-2 lg:hover:bg-gray-50 dark:lg:hover:bg-zinc-800 active:scale-95 transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">real_estate_agent</span>
                                عقاراتي
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Mobile Title Section (Simple) */}
                <div className="sm:hidden mt-4 mb-6">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">إعدادات ملفك</h1>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                    <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-10 h-fit">
                        <ProfileCard
                            user={u}
                            role={role}
                            onEdit={() => setEditModalOpen(true)}
                        />

                        {/* Mobile Action Buttons */}
                        <div className="sm:hidden grid grid-cols-2 gap-3">
                            <Link href="/add-property" className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-primary/10 text-primary font-bold text-sm transition-transform active:scale-95">
                                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                إضافة عقار
                            </Link>
                            <Link href="/my-properties" className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 font-bold text-sm transition-transform active:scale-95 active:bg-gray-50 dark:active:bg-zinc-800">
                                <span className="material-symbols-outlined text-[20px]">real_estate_agent</span>
                                عقاراتي
                            </Link>
                        </div>

                        <SectionCard title="إحصائيات سريعة">
                            {statsError ? (
                                <div className="p-5" data-testid="profile-stats-error">
                                    <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-3">{statsError}</p>
                                    <button
                                        type="button"
                                        onClick={() => setStatsReloadKey((x) => x + 1)}
                                        className="w-full h-11 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 font-bold hover:bg-red-100 dark:hover:bg-red-500/15 transition-colors"
                                    >
                                        إعادة المحاولة
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <StatTile
                                            icon="home_work"
                                            label="عقاراتي"
                                            value={stats.properties}
                                            loading={statsLoading}
                                            colorClass="text-blue-500"
                                        />
                                        <StatTile
                                            icon="lock_open"
                                            label="مفتوح"
                                            value={stats.unlocked}
                                            loading={statsLoading}
                                            colorClass="text-green-500"
                                        />
                                        <StatTile
                                            icon="favorite"
                                            label="المفضلة"
                                            value={stats.favorites}
                                            loading={statsLoading}
                                            colorClass="text-red-500"
                                            className="col-span-2 sm:col-span-1"
                                        />
                                    </div>
                                </div>
                            )}
                        </SectionCard>
                    </aside>

                    <main className="lg:col-span-8 space-y-6">
                        <SectionCard title="إدارة الحساب">
                            <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <ActionItem
                                    href="/my-properties"
                                    icon="real_estate_agent"
                                    title="إدارة عقاراتي"
                                    description="تعديل ورفع الصور وإدارة الحالة"
                                />

                                <ActionItem
                                    href="/bookings"
                                    icon="event_note"
                                    title="حجوزاتي وطلباتي"
                                    description="متابعة الطلبات والحجوزات الحالية"
                                />

                                <ActionItem
                                    href="/favorites"
                                    icon="favorite"
                                    title="العقارات المفضلة"
                                    description="الوصول السريع لما اخترته"
                                />

                                <ActionItem
                                    href="/messages"
                                    icon="forum"
                                    title="الرسائل"
                                    description="تواصل مباشر مع الملاك والمستأجرين"
                                />

                                <ActionItem
                                    onClick={() => setEditModalOpen(true)}
                                    icon="settings"
                                    title="إعدادات الحساب"
                                    description="الاسم، الهاتف، والملف الشخصي"
                                />

                                <ActionItem
                                    href="/add-property"
                                    icon="add_circle"
                                    title="إضافة عقار جديد"
                                    description="ارفع عقارك واعرضه للآلاف"
                                    variant="primary"
                                />

                                {isAdmin && (
                                    <ActionItem
                                        href="/admin"
                                        icon="shield_person"
                                        title="لوحة المشرفين"
                                        description="التحكم الكامل في النظام"
                                        variant="primary"
                                    />
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard title="تسجيل الخروج">
                            <div className="p-5">
                                <button
                                    type="button"
                                    onClick={() => logout()}
                                    className="w-full h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300
                             font-black flex items-center justify-center gap-2
                             lg:hover:bg-red-100 dark:lg:hover:bg-red-500/15 transition-all
                             focus:outline-none focus:ring-2 focus:ring-red-500/30 active:scale-[0.98] active:bg-red-100 dark:active:bg-red-500/20"
                                >
                                    <span className="material-symbols-outlined">logout</span>
                                    تسجيل الخروج من الحساب
                                </button>

                                <p className="mt-6 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                                    الإصدار 1.2.0 • عقارات جمصة © 2024
                                </p>
                            </div>
                        </SectionCard>
                    </main>
                </div>
            </div>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                onUpdated={(payload) => {
                    setProfileOverrides(payload);
                    setStatsReloadKey((x) => x + 1);
                }}
            />
        </div>
    );
}

/* ---------- Helpers (UI) ---------- */

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 transition-all hover:shadow-md">
            <div className="px-6 pt-6 pb-2">
                <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function ProfileCard({
    user,
    role,
    onEdit,
}: {
    user: ReturnType<typeof normalizeUser>;
    role: ReturnType<typeof getRolePresentation>;
    onEdit: () => void;
}) {
    return (
        <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden group">
            {/* Subtle Gradient Top line replaced with minimal border approach or clean finish as requested */}
            <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                    <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-gray-50 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 shadow-inner flex items-center justify-center overflow-hidden transition-transform lg:group-hover:scale-105">
                        {user.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined text-gray-300 text-5xl">person</span>
                        )}
                    </div>

                    {user.isVerified && (
                        <div
                            className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 border-4 border-white dark:border-zinc-900 flex items-center justify-center shadow-lg"
                            title="موثق"
                        >
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white truncate">{user.name}</h3>

                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 truncate dir-ltr text-right">
                        {user.phone || 'لا يوجد رقم هاتف'}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] px-3.5 py-1.5 rounded-full font-black inline-flex items-center gap-1.5 ${role.badgeClass}`}>
                            <span className="material-symbols-outlined text-[16px]">{role.icon}</span>
                            {role.label}
                        </span>

                        {user.email && (
                            <span className="hidden sm:inline-flex text-[11px] px-3.5 py-1.5 rounded-full font-bold bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                                {user.email}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onEdit}
                    className="w-11 h-11 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400
                     lg:hover:bg-primary/10 lg:hover:text-primary transition-all active:scale-90 active:bg-primary/10 active:text-primary shrink-0"
                    aria-label="تعديل البيانات"
                >
                    <span className="material-symbols-outlined">edit</span>
                </button>
            </div>
        </section>
    );
}

function StatTile({
    icon,
    label,
    value,
    loading,
    colorClass,
    className = '',
}: {
    icon: string;
    label: string;
    value: number;
    loading: boolean;
    colorClass: string;
    className?: string;
}) {
    return (
        <div className={`bg-gray-50 dark:bg-zinc-950/40 p-4 rounded-2xl text-center border border-gray-100 dark:border-white/5 ${className}`}>
            <div className={`text-2xl mb-1.5 flex justify-center ${colorClass}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>

            <div className="text-xl font-black text-gray-900 dark:text-white mb-1 leading-none">
                {loading ? (
                    <span className="inline-block h-6 w-10 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse align-middle" />
                ) : (
                    value
                )}
            </div>

            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest opacity-80">
                {label}
            </div>
        </div>
    );
}

function ActionItem({
    href,
    onClick,
    icon,
    title,
    description,
    variant = 'default',
}: {
    href?: string;
    onClick?: () => void;
    icon: string;
    title: string;
    description?: string;
    variant?: 'default' | 'primary';
}) {
    const isPrimary = variant === 'primary';

    const inner = (
        <div
            className={[
                'rounded-2xl p-4 min-h-[64px] flex items-center justify-between gap-4',
                'transition-all border group',
                'focus:outline-none focus:ring-2 focus:ring-primary/40',
                isPrimary
                    ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 lg:hover:bg-primary/10 active:bg-primary/10'
                    : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/5 lg:hover:bg-gray-50 dark:lg:hover:bg-zinc-800 active:bg-gray-50 dark:active:bg-zinc-800',
            ].join(' ')}
        >
            <div className="flex items-center gap-4 min-w-0">
                <div
                    className={[
                        'w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all lg:group-hover:scale-110 group-active:scale-95',
                        isPrimary ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 lg:group-hover:bg-primary/15 lg:group-hover:text-primary group-active:bg-primary/15 group-active:text-primary',
                    ].join(' ')}
                >
                    <span className="material-symbols-outlined text-[24px]">{icon}</span>
                </div>

                <div className="min-w-0">
                    <div className={`font-black truncate ${isPrimary ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                        {title}
                    </div>
                    {description ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{description}</div>
                    ) : null}
                </div>
            </div>

            <span className={`material-symbols-outlined ${isPrimary ? 'text-primary' : 'text-gray-300'} rtl:rotate-180 transition-transform lg:group-hover:translate-x-[-4px]`}>
                chevron_right
            </span>
        </div>
    );

    if (href) return <Link href={href} className="block transition-transform active:scale-[0.99]" aria-label={title}>{inner}</Link>;
    return (
        <button type="button" onClick={onClick} className="w-full text-right transition-transform active:scale-[0.99]" aria-label={title}>
            {inner}
        </button>
    );
}

/* ---------- Helpers (Data normalization) ---------- */

function normalizeUser(user: UserLike | null, overrides: ProfileOverrides | null) {
    const id = user?.id || '';
    const rawName = (overrides?.name ?? user?.name ?? user?.full_name ?? '').trim();
    const rawPhone = (overrides?.phone ?? user?.phone ?? '').trim();

    const avatar = user?.avatar ?? user?.avatar_url ?? null;
    const role = user?.role ?? null;

    const isVerified = Boolean(user?.isVerified ?? user?.is_verified ?? false);
    const email = user?.email ?? null;

    return {
        id,
        name: rawName || 'مستخدم',
        phone: rawPhone,
        avatar,
        role,
        isVerified,
        email,
    };
}

function getRolePresentation(role: string | null | undefined) {
    const normalizedRole = normalizeRoleKey(role);

    if (normalizedRole === 'admin') {
        return {
            key: 'admin' as const,
            label: toRoleLabel(normalizedRole),
            icon: 'shield_person',
            badgeClass: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300',
        };
    }

    if (normalizedRole === 'landlord') {
        return {
            key: 'landlord' as const,
            label: toRoleLabel(normalizedRole),
            icon: 'real_estate_agent',
            badgeClass: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
        };
    }

    return {
        key: 'tenant' as const,
        label: toRoleLabel(normalizedRole),
        icon: 'person',
        badgeClass: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300',
    };
}

/* ---------- Loading + Logged-out ---------- */

function ProfilePageSkeleton() {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-28" dir="rtl">
            <div className="mx-auto w-full max-w-6xl px-4 pt-6 lg:pt-10 animate-pulse">
                <div className="h-8 w-40 rounded-lg bg-gray-200 dark:bg-zinc-800" />
                <div className="mt-3 h-4 w-80 rounded bg-gray-200 dark:bg-zinc-800" />

                <div className="mt-10 grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="w-22 h-22 rounded-full bg-gray-200 dark:bg-zinc-800" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
                                    <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 rounded-2xl bg-gray-200 dark:bg-zinc-800" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoggedOutCTA() {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6 pb-24" dir="rtl">
            <div className="w-full max-w-md text-center">
                <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-full mb-8 mx-auto flex items-center justify-center border border-gray-100 dark:border-white/5 shadow-xl">
                    <span className="material-symbols-outlined text-gray-300 text-6xl">person_off</span>
                </div>

                <h1 className="text-3xl font-black mb-3 text-gray-900 dark:text-white">مرحباً بك في عقارات جمصة</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-10 text-sm leading-relaxed max-w-[320px] mx-auto">
                    سجّل دخولك الآن لتتمكن من حفظ مفضلاتك، إدارة عقاراتك، والتواصل بسهولة مع الملاك.
                </p>

                <Link
                    href="/auth"
                    className="inline-flex w-full items-center justify-center gap-3 h-14 rounded-2xl bg-primary text-white font-black
                     hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
                >
                    <span className="material-symbols-outlined">login</span>
                    تسجيل الدخول / إنشاء حساب
                </Link>

                <Link href="/" className="mt-8 inline-block text-xs font-bold text-gray-400 hover:text-primary transition-colors">
                    تصفح العقارات كزائر
                </Link>
            </div>
        </div>
    );
}



