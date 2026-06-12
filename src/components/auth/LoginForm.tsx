'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type SocialProvider = 'google' | 'facebook' | 'apple';

function SocialIcon({ provider }: { provider: SocialProvider }) {
    if (provider === 'google') {
        return (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z" />
                <path fill="#34A853" d="M3.2 7.3l3.2 2.4C7.3 7.9 9.5 6.3 12 6.3c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2 12 2 8.1 2 4.7 4.2 3.2 7.3z" />
                <path fill="#FBBC05" d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3-2.5c-.8.6-1.9 1-3.4 1-2.5 0-4.6-1.7-5.4-4l-3.2 2.5C4.9 19.7 8.2 22 12 22z" />
                <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.2-.2-1.7H12v3.9h5.5c-.3 1.5-1.2 2.7-2.5 3.5l3 2.5c1.8-1.7 3.6-4.8 3.6-8.2z" />
            </svg>
        );
    }

    if (provider === 'facebook') {
        return (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#1877F2]" aria-hidden="true">
                <path
                    fill="currentColor"
                    d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 1-2 2v2.2h3.4l-.5 3.5h-2.9V24C19.6 23.1 24 18.1 24 12.1z"
                />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-black dark:text-white" aria-hidden="true">
            <path
                fill="currentColor"
                d="M17.57 12.66c-.03-3.24 2.64-4.8 2.76-4.87-1.51-2.2-3.85-2.5-4.67-2.54-1.97-.2-3.88 1.18-4.88 1.18-1.03 0-2.58-1.16-4.24-1.13-2.14.03-4.13 1.27-5.23 3.2-2.27 3.93-.58 9.7 1.6 12.86 1.07 1.55 2.32 3.28 3.97 3.22 1.61-.07 2.21-1.02 4.15-1.02 1.92 0 2.48 1.02 4.16.98 1.72-.03 2.81-1.54 3.84-3.11 1.23-1.78 1.72-3.53 1.74-3.62-.04-.01-3.31-1.27-3.34-5.15zM14.37 3.2c.86-1.06 1.44-2.5 1.27-3.2-1.24.05-2.8.85-3.69 1.88-.79.91-1.5 2.37-1.3 3.03 1.39.1 2.82-.7 3.72-1.71z"
            />
        </svg>
    );
}

export default function LoginForm({
    onSwitchToSignUp,
    onSwitchToReset,
    redirectUrl
}: {
    onSwitchToSignUp: () => void;
    onSwitchToReset: () => void;
    redirectUrl?: string;
}) {
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const { login, signInWithProvider } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const success = await login(email, password);
            if (!success) {
                setError('البريد الإلكتروني أو كلمة المرور غير صحيحة. تحقق من بياناتك وحاول مجدداً.');
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
        <div className="relative flex flex-col">
            <header className="border-b border-border-light/70 px-5 pb-4 pt-5 dark:border-border-dark/70">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-gray-500 hover:text-primary transition-colors focus:ring-2 focus:ring-primary/20"
                        aria-label="العودة"
                        type="button"
                    >
                        <span aria-hidden="true" className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                    <nav className="text-xs font-bold text-gray-400 flex items-center gap-2">
                        <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
                        <span aria-hidden="true" className="material-symbols-outlined text-[14px]">chevron_left</span>
                        <span className="text-gray-600 dark:text-gray-300">تسجيل الدخول</span>
                    </nav>
                </div>
            </header>

            <main className="px-5 py-6 sm:px-6">
                <div className="mb-6 text-right">
                    <h1 className="text-3xl font-bold text-text-main dark:text-white leading-tight">تسجيل الدخول</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => handleSocialLogin('google')}
                            className="h-11 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm font-semibold text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            type="button"
                            disabled={loading || socialLoading !== null}
                        >
                            {socialLoading !== 'google' && <SocialIcon provider="google" />}
                            {socialLoading === 'google' ? 'جارٍ...' : 'جوجل'}
                        </button>
                        <button
                            onClick={() => handleSocialLogin('facebook')}
                            className="h-11 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm font-semibold text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            type="button"
                            disabled={loading || socialLoading !== null}
                        >
                            {socialLoading !== 'facebook' && <SocialIcon provider="facebook" />}
                            {socialLoading === 'facebook' ? 'جارٍ...' : 'فيسبوك'}
                        </button>
                        <button
                            onClick={() => handleSocialLogin('apple')}
                            className="h-11 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm font-semibold text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            type="button"
                            disabled={loading || socialLoading !== null}
                        >
                            {socialLoading !== 'apple' && <SocialIcon provider="apple" />}
                            {socialLoading === 'apple' ? 'جارٍ...' : 'Apple'}
                        </button>
                    </div>

                    <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-border-light dark:border-border-dark" />
                        <span className="mx-3 text-xs text-text-muted dark:text-gray-400">أو سجل باستخدام بريدك الإلكتروني</span>
                        <div className="flex-grow border-t border-border-light dark:border-border-dark" />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="email">
                            البريد الإلكتروني
                        </label>
                        <input
                            className="w-full h-12 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark/80 px-4 text-right text-base text-text-main dark:text-white placeholder:text-text-muted/60 dark:placeholder:text-gray-400/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            id="email"
                            name="email"
                            placeholder="بريدك الإلكتروني (مثل: name@mail.com)"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="password">
                                كلمة المرور
                            </label>
                            <button
                                onClick={onSwitchToReset}
                                type="button"
                                className="text-sm font-semibold text-primary hover:underline"
                            >
                                نسيت كلمة المرور؟
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                className="w-full h-12 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark/80 px-4 pl-12 text-right text-base text-text-main dark:text-white placeholder:text-text-muted/60 dark:placeholder:text-gray-400/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                id="password"
                                name="password"
                                placeholder="أدخل كلمة المرور"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                                type="button"
                                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                            >
                                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

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
                        <span>{loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}</span>
                    </button>
                </form>
            </main>

            <footer className="px-5 pb-6 pt-2 text-center sm:px-6">
                <p className="text-sm text-text-muted dark:text-gray-400">
                    ليس لديك حساب؟
                    <button
                        onClick={onSwitchToSignUp}
                        className="font-bold text-primary hover:underline pr-1"
                        type="button"
                    >
                        أنشئ حسابًا جديدًا
                    </button>
                </p>
            </footer>
        </div>
    );
}
