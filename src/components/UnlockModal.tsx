'use client';

import { useState } from 'react';
import { unlockProperty as unlockPropertyInMock, addNotification } from '@/lib/storage';
import { useUser } from '@/hooks/useUser';
import { supabaseService } from '@/services/supabaseService';
import { getIsMockMode } from '@/config/constants';

interface UnlockModalProps {
    propertyId: string;
    onClose: () => void;
    onSuccess?: () => void;
}

const UNLOCK_AMOUNT = 50;

export function UnlockModal({ propertyId, onClose, onSuccess }: UnlockModalProps) {
    const { user } = useUser();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [step, setStep] = useState(1);

    const handleUpload = async () => {
        if (!file || !user) return;

        setUploading(true);

        try {
            const receiptPath = await supabaseService.uploadUnlockPaymentReceipt(propertyId, user.id, file);

            await supabaseService.createPaymentRequest({
                userId: user.id,
                propertyId,
                amount: UNLOCK_AMOUNT,
                paymentMethod: 'vodafone_cash',
                receiptImage: receiptPath,
            });

            if (getIsMockMode()) {
                unlockPropertyInMock(propertyId);
            }

            await addNotification({
                userId: user.id,
                title: getIsMockMode() ? 'تم فك القفل تجريبيا' : 'تم إرسال طلب فك القفل',
                message: getIsMockMode()
                    ? 'أصبح زر الحجز متاحا لهذا العقار في وضع المحاكاة.'
                    : 'تم إرسال إيصال الدفع. سيظهر زر الحجز بعد مراجعة الطلب والموافقة عليه.',
                type: 'info',
            });

            setStep(3);

            setTimeout(() => {
                onClose();
                onSuccess?.();
            }, 2000);
        } catch (error) {
            console.error(error);
            alert('فشل إرسال طلب الدفع، حاول مجددا.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-surface-light shadow-2xl dark:bg-surface-dark">
                <div className="p-6">
                    {step === 1 ? (
                        <div className="animate-fadeIn text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <span className="material-symbols-outlined text-3xl text-primary">payments</span>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-text-main">فك قفل الحجز لهذا العقار</h3>
                            <p className="mb-6 text-sm text-text-muted">
                                للوصول إلى زر الحجز لهذا العقار، حوّل <span className="font-bold text-primary">{UNLOCK_AMOUNT} ج.م</span> ثم ارفع الإيصال للمراجعة.
                            </p>

                            <div className="mb-6 rounded-2xl border border-primary/30 bg-background-light p-4 dark:bg-background-dark">
                                <p className="mb-1 text-xs text-text-muted">رقم التحويل</p>
                                <p className="text-2xl font-bold tracking-widest text-primary">01012345678</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="w-full rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:opacity-90"
                            >
                                تم التحويل، ارفع الإيصال
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 block w-full text-sm text-text-muted transition-colors hover:text-text-main"
                            >
                                إلغاء
                            </button>
                        </div>
                    ) : null}

                    {step === 2 ? (
                        <div className="animate-fadeIn">
                            <h3 className="mb-4 text-center text-lg font-bold text-text-main">تأكيد التحويل</h3>
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border-light p-10 transition-colors hover:bg-background-light dark:border-border-dark dark:hover:bg-background-dark">
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    accept="image/*"
                                />
                                <span className="material-symbols-outlined mb-2 text-4xl text-text-muted">cloud_upload</span>
                                <p className="text-sm text-text-muted">{file ? file.name : 'ارفع صورة إيصال التحويل'}</p>
                            </label>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    disabled={!file || uploading}
                                    onClick={() => void handleUpload()}
                                    className="flex-1 rounded-2xl bg-primary py-4 font-bold text-white disabled:bg-gray-400"
                                >
                                    {uploading ? 'جار الإرسال...' : 'تأكيد الإرسال'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-4 font-bold text-text-muted"
                                >
                                    رجوع
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {step === 3 ? (
                        <div className="animate-fadeIn py-10 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/20 text-success">
                                <span className="material-symbols-outlined animate-bounce text-5xl">check_circle</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main">تم استلام طلبك</h3>
                            <p className="text-text-muted">
                                {getIsMockMode()
                                    ? 'تم تفعيل الوصول التجريبي لهذا العقار.'
                                    : 'سيظهر زر الحجز بعد مراجعة الدفع والموافقة على فك القفل.'}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
