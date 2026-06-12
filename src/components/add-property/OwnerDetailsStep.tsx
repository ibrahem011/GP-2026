'use client';

type OwnerDetailsStepProps = {
    user: {
        name: string;
        isVerified: boolean;
    };
    value: string;
    onChange: (name: string) => void;
};

export default function OwnerDetailsStep({ user, value, onChange }: OwnerDetailsStepProps) {
    return (
        <div className="space-y-4">
            {!user.isVerified ? (
                <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
                    <span aria-hidden="true" className="material-symbols-outlined shrink-0">warning</span>
                    <p>
                        حسابك غير موثق حالياً. يمكنك تعديل اسمك المستعار الآن، لكن ننصح بتوثيق الحساب بالهوية الوطنية
                        لزيادة ثقة العملاء بعقاراتك.
                    </p>
                </div>
            ) : null}

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">اسم صاحب العقار *</label>
                    {user.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                            <span aria-hidden="true" className="material-symbols-outlined text-[14px]">verified</span>
                            موثق
                        </span>
                    ) : null}
                </div>

                <input
                    type="text"
                    value={value}
                    readOnly={user.isVerified}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="الاسم كما سيظهر للمستأجرين"
                    className={`w-full rounded-xl border-2 p-4 text-gray-900 outline-none transition-all dark:text-white ${
                        user.isVerified
                            ? 'cursor-not-allowed border-gray-200 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800'
                            : 'border-transparent bg-gray-50 focus:border-primary/50 focus:bg-white dark:bg-zinc-800 dark:focus:bg-black'
                    }`}
                />

                {user.isVerified ? (
                    <p className="text-xs text-green-700 dark:text-green-300">
                        لا يمكن تعديل الاسم لأن حسابك موثق رسمياً.
                    </p>
                ) : null}
            </div>
        </div>
    );
}
