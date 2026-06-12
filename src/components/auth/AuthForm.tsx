'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassInput, GlassButton } from '@/components/ui/glass';

/**
 * @deprecated PR0: This legacy form is not used by app routes.
 * Keep temporarily for compatibility/tests and remove in PR7 after usage cleanup.
 */
export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { login, register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const fullName = formData.get('full_name') as string;
        const phone = formData.get('phone') as string;

        try {
            if (isLogin) {
                const success = await login(email, password);
                if (!success) {
                    setError('بيانات الدخول غير صحيحة');
                    return;
                }
                router.push('/');
            } else {
                const success = await register({
                    email,
                    password,
                    name: fullName,
                    phone,
                    role: 'tenant',
                });
                if (!success) {
                    setError('فشل إنشاء الحساب');
                    return;
                }
                setSuccess('تم إنشاء حسابك بنجاح! يرجى تأكيد بريدك الإلكتروني.');
            }
        } catch (err) {
            setError('حدث خطأ غير متوقع');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard variant="elevated" padding="lg" className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
                    <span aria-hidden="true" className="material-symbols-outlined text-white text-3xl">
                        {isLogin ? 'login' : 'person_add'}
                    </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                    {isLogin ? 'أدخل بياناتك للوصول إلى حسابك' : 'أنشئ حسابك للبدء في إضافة عقاراتك'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <>
                        <GlassInput
                            label="الاسم الكامل"
                            name="full_name"
                            type="text"
                            required
                            placeholder="أحمد محمد"
                            icon={<span aria-hidden="true" className="material-symbols-outlined text-gray-400">person</span>}
                        />
                        <GlassInput
                            label="رقم الهاتف"
                            name="phone"
                            type="tel"
                            required
                            placeholder="01xxxxxxxxx"
                            dir="ltr"
                            icon={<span aria-hidden="true" className="material-symbols-outlined text-gray-400">phone</span>}
                        />
                    </>
                )}

                <GlassInput
                    label="البريد الإلكتروني"
                    name="email"
                    type="email"
                    required
                    placeholder="example@mail.com"
                    dir="ltr"
                    icon={<span aria-hidden="true" className="material-symbols-outlined text-gray-400">mail</span>}
                    data-testid="auth-email"
                />

                <GlassInput
                    label="كلمة المرور"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    icon={<span aria-hidden="true" className="material-symbols-outlined text-gray-400">lock</span>}
                    data-testid="auth-password"
                />

                {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
                        {success}
                    </div>
                )}

                <GlassButton
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={loading}
                    disabled={loading}
                    className="mt-6"
                    data-testid="auth-submit"
                >
                    {loading ? 'جاري المعالجة...' : isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                </GlassButton>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError(null);
                        setSuccess(null);
                    }}
                    className="text-primary hover:text-primary/80 text-sm transition-colors"
                >
                    {isLogin ? 'لا تملك حساباً؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
                </button>
            </div>

            {isLogin && (
                <div className="mt-4 text-center">
                    <button className="text-gray-400 hover:text-gray-300 text-xs transition-colors">
                        نسيت كلمة المرور؟
                    </button>
                </div>
            )}
        </GlassCard>
    );
}
