'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordForm({ onSwitchToLogin, redirectUrl }: { onSwitchToLogin: () => void; redirectUrl?: string }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData(e.currentTarget);
        const contact = (formData.get('contact') as string) || '';

        try {
            if (!contact.trim()) {
                setError('يرجى إدخال البريد الإلكتروني أو رقم الهاتف.');
                return;
            }

            // TODO: Implement real reset password flow via Supabase OTP.
            setSuccess('تم إرسال رمز التحقق بنجاح. تحقق من الرسائل ثم أكمل استعادة حسابك.');

            setTimeout(() => {
                router.replace(redirectUrl || '/');
            }, 3000);
        } catch (err) {
            setError('حدث خطأ غير متوقع.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full rounded-2xl border border-border-light/80 dark:border-border-dark/80 bg-surface-light dark:bg-surface-dark shadow-2xl overflow-hidden">
            <header className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-light/70 dark:border-border-dark/70">
                <button
                    onClick={onSwitchToLogin}
                    aria-label="العودة لتسجيل الدخول"
                    className="group flex size-10 items-center justify-center rounded-full text-text-main dark:text-white transition-all hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105"
                    type="button"
                >
                    <span aria-hidden="true" className="material-symbols-outlined text-[22px] transition-transform group-hover:translate-x-0.5">
                        arrow_forward
                    </span>
                </button>
                <div className="text-sm font-semibold text-text-muted dark:text-gray-400">استعادة الحساب</div>
                <div className="size-10" />
            </header>

            <main className="px-5 py-6 sm:px-6">
                <div className="mb-7 text-center">
                    <div className="mx-auto mb-4 flex size-24 items-center justify-center rounded-full bg-primary/10">
                        <span aria-hidden="true" className="material-symbols-outlined text-primary text-[48px]">lock_reset</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-main dark:text-white">نسيت كلمة المرور؟</h1>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted dark:text-gray-400">
                        لا تقلق، أدخل بريدك الإلكتروني أو رقم الهاتف المسجل أدناه لنرسل لك رمز التحقق.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-main dark:text-gray-200" htmlFor="contact-input">
                            البريد الإلكتروني أو رقم الهاتف
                        </label>
                        <div className="relative">
                            <input
                                className="w-full h-12 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark/80 pr-11 pl-4 text-right text-base text-text-main dark:text-white placeholder:text-text-muted/60 dark:placeholder:text-gray-400/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                dir="rtl"
                                id="contact-input"
                                name="contact"
                                placeholder="مثال: 010xxxxxxx أو example@mail.com"
                                type="text"
                                autoComplete="email"
                                required
                            />
                            <span aria-hidden="true" className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-gray-400 text-[20px]">
                                contact_mail
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-500 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-center text-sm text-green-700 dark:text-green-300">
                            {success}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                        type="submit"
                    >
                        {loading && (
                            <span className="inline-block h-5 w-5 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                        )}
                        <span>{loading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}</span>
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        className="text-primary font-semibold hover:underline"
                        type="button"
                        onClick={onSwitchToLogin}
                    >
                        العودة إلى تسجيل الدخول
                    </button>
                </div>
            </main>
        </div>
    );
}
