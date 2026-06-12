'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type SocialProvider = 'google' | 'facebook' | 'apple';

export default function SignUpForm({ onSwitchToLogin, redirectUrl }: { onSwitchToLogin: () => void; redirectUrl?: string }) {
    const [role, setRole] = useState<'tenant' | 'landlord'>('tenant');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const { register, signInWithProvider } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!agreedToTerms) {
            setError('يجب الموافقة على الشروط والأحكام');
            setLoading(false);
            return;
        }

        const formData = new FormData(e.currentTarget);
        const fullName = formData.get('fullname') as string;
        const phone = formData.get('phone') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const success = await register({
                name: fullName,
                email,
                phone,
                password,
                role,
            });
            if (!success) {
                setError('فشل إنشاء الحساب. إذا كان البريد مسجلًا بالفعل استخدم تسجيل الدخول.');
                return;
            }
            router.replace(redirectUrl || '/');
        } catch (err) {
            setError('حدث خطأ غير متوقع');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: SocialProvider) => {
        setError(null);
        setSocialLoading(provider);

        const result = await signInWithProvider(provider, redirectUrl);
        if (!result.success) {
            setError(result.error || 'تعذر بدء تسجيل الدخول الاجتماعي');
            setSocialLoading(null);
        }
    };

    return (
        <div className="flex flex-col">
            <header className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-light/70 dark:border-border-dark/70">
                <button
                    onClick={onSwitchToLogin}
                    className="group flex size-10 items-center justify-center rounded-full text-text-main dark:text-white transition-all hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105"
                    aria-label="العودة لتسجيل الدخول"
                    type="button"
                >
                    <span aria-hidden="true" className="material-symbols-outlined text-[22px] transition-transform group-hover:translate-x-0.5">
                        arrow_forward
                    </span>
                </button>

                <h2 className="text-lg font-bold text-text-main dark:text-white">إنشاء حساب جديد</h2>
                <div className="size-10" />
            </header>

            <main className="px-5 py-6 sm:px-6">
                <div className="mb-6 text-right">
                    <h1 className="text-3xl font-bold text-text-main dark:text-white leading-tight">مرحبًا بك في عقارات جمصة</h1>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted dark:text-gray-400">
                        سجّل بياناتك الأساسية للبدء في رحلتك العقارية.
                    </p>
                </div>

                <div className="mb-5">
                    <p className="mb-2 text-sm font-semibold text-text-main dark:text-gray-200">نوع الحساب</p>
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                        <button
                            type="button"
                            className={`h-10 rounded-lg text-sm font-bold transition-all ${role === 'tenant'
                                ? 'bg-white dark:bg-primary text-primary dark:text-white shadow'
                                : 'text-slate-600 dark:text-slate-300'
                                }`}
                            onClick={() => setRole('tenant')}
                        >
                            مستأجر
                        </button>
                        <button
                            type="button"
                            className={`h-10 rounded-lg text-sm font-bold transition-all ${role === 'landlord'
                                ? 'bg-white dark:bg-primary text-primary dark:text-white shadow'
                                : 'text-slate-600 dark:text-slate-300'
                                }`}
                            onClick={() => setRole('landlord')}
                        >
                            مؤجر
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="fullname">
                            الاسم بالكامل
                        </label>
                        <input
                            id="fullname"
                            name="fullname"
                            type="text"
                            autoComplete="name"
                            placeholder="أدخل اسمك الثلاثي"
                            className="w-full h-12 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark/80 px-4 text-right text-base text-text-main dark:text-white placeholder:text-text-muted/60 dark:placeholder:text-gray-400/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="phone">
                            رقم الهاتف
                        </label>
                        <div className="flex h-12 overflow-hidden rounded-xl border border-border-light dark:border-border-dark focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 px-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                                +20
                            </div>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                inputMode="tel"
                                placeholder="1xxxxxxxxx"
                                className="flex-1 bg-white dark:bg-surface-dark/80 px-4 text-right text-base text-text-main dark:text-white placeholder:text-text-muted/60 dark:placeholder:text-gray-400/60 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="email">
                            البريد الإلكتروني
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            placeholder="example@domain.com"
                            className="w-full h-12 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark/80 px-4 text-right text-base text-text-main dark:text-white placeholder:text-text-muted/60 dark:placeholder:text-gray-400/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="password">
                            كلمة المرور
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                minLength={8}
                                placeholder="8 أحرف على الأقل"
                                className="w-full h-12 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark/80 px-4 pl-12 text-right text-base text-text-main dark:text-white placeholder:text-text-muted/60 dark:placeholder:text-gray-400/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                required
                            />
                            <button
                                type="button"
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                            >
                                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <label className="flex items-start gap-2 text-sm text-text-muted dark:text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-border-light dark:border-border-dark text-primary focus:ring-primary/40"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                        />
                        <span>
                            أوافق على <a className="text-primary font-semibold hover:underline" href="#">الشروط والأحكام</a> و{' '}
                            <a className="text-primary font-semibold hover:underline" href="#">سياسة الخصوصية</a>
                        </span>
                    </label>

                    {error && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-500 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <button
                        disabled={loading || socialLoading !== null}
                        className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                        type="submit"
                    >
                        {loading && (
                            <span className="inline-block h-5 w-5 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                        )}
                        <span>{loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}</span>
                    </button>
                </form>

                <div className="mt-5">
                    <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-border-light dark:border-border-dark" />
                        <span className="mx-3 text-xs text-text-muted dark:text-gray-400">أو أنشئ الحساب عبر</span>
                        <div className="flex-grow border-t border-border-light dark:border-border-dark" />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3">
                        <button
                            onClick={() => handleSocialLogin('google')}
                            className="h-11 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm font-semibold text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            type="button"
                            disabled={loading || socialLoading !== null}
                        >
                            {socialLoading === 'google' ? 'جارٍ...' : 'جوجل'}
                        </button>
                        <button
                            onClick={() => handleSocialLogin('facebook')}
                            className="h-11 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm font-semibold text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            type="button"
                            disabled={loading || socialLoading !== null}
                        >
                            {socialLoading === 'facebook' ? 'جارٍ...' : 'فيسبوك'}
                        </button>
                        <button
                            onClick={() => handleSocialLogin('apple')}
                            className="h-11 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm font-semibold text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            type="button"
                            disabled={loading || socialLoading !== null}
                        >
                            {socialLoading === 'apple' ? 'جارٍ...' : 'Apple'}
                        </button>
                    </div>
                </div>
            </main>

            <footer className="px-5 pb-6 pt-2 text-center sm:px-6">
                <p className="text-sm text-text-muted dark:text-gray-400">
                    لديك حساب بالفعل؟
                    <button onClick={onSwitchToLogin} className="text-primary font-bold hover:underline pr-1" type="button">
                        تسجيل الدخول
                    </button>
                </p>
            </footer>
        </div>
    );
}
