'use client';

import React from 'react';

interface TenantFormProps {
    tenantName: string;
    tenantPhone: string;
    tenantEmail: string;
    onNameChange: (name: string) => void;
    onNameBlur: () => void;
    onPhoneChange: (phone: string) => void;
    onPhoneBlur: () => void;
    onEmailChange: (email: string) => void;
    onEmailBlur: () => void;
    phoneHelper?: string;
    errors?: {
        tenantName?: string;
        tenantPhone?: string;
        tenantEmail?: string;
    };
}

export default function TenantForm({
    tenantName,
    tenantPhone,
    tenantEmail,
    onNameChange,
    onNameBlur,
    onPhoneChange,
    onPhoneBlur,
    onEmailChange,
    onEmailBlur,
    phoneHelper,
    errors,
}: TenantFormProps) {
    const cardClasses = 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';
    const labelClasses = 'mb-1 block text-sm font-semibold text-gray-700 dark:text-zinc-200';
    const inputClasses = 'w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100';
    const errorClasses = 'mt-1 text-xs text-red-600 dark:text-red-400';

    return (
        <div className={cardClasses}>
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-zinc-100">بيانات المستأجر</h3>

            <div className="space-y-4">
                <div>
                    <label className={labelClasses} htmlFor="tenant-name">
                        الاسم الكامل <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="tenant-name"
                        type="text"
                        value={tenantName}
                        onChange={(e) => onNameChange(e.target.value)}
                        onBlur={onNameBlur}
                        className={inputClasses}
                        placeholder="ادخل الاسم الكامل"
                        autoComplete="name"
                        required
                        aria-invalid={Boolean(errors?.tenantName)}
                        aria-describedby={errors?.tenantName ? 'tenant-name-error' : undefined}
                    />
                    {errors?.tenantName ? (
                        <p id="tenant-name-error" className={errorClasses}>{errors.tenantName}</p>
                    ) : null}
                </div>

                <div>
                    <label className={labelClasses} htmlFor="tenant-phone">
                        رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="tenant-phone"
                        type="tel"
                        inputMode="numeric"
                        value={tenantPhone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        onBlur={onPhoneBlur}
                        className={inputClasses}
                        placeholder="01012345678 أو +201012345678"
                        autoComplete="tel"
                        required
                        aria-invalid={Boolean(errors?.tenantPhone)}
                        aria-describedby={[
                            'tenant-phone-hint',
                            phoneHelper ? 'tenant-phone-helper' : null,
                            errors?.tenantPhone ? 'tenant-phone-error' : null,
                        ].filter(Boolean).join(' ')}
                    />
                    <p id="tenant-phone-hint" className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                        نقبل 01012345678 أو +201012345678، وسيتم توحيده تلقائيًا إلى 01XXXXXXXXX.
                    </p>
                    {phoneHelper ? (
                        <p id="tenant-phone-helper" className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                            {phoneHelper}
                        </p>
                    ) : null}
                    {errors?.tenantPhone ? (
                        <p id="tenant-phone-error" className={errorClasses}>{errors.tenantPhone}</p>
                    ) : null}
                </div>

                <div>
                    <label className={labelClasses} htmlFor="tenant-email">
                        البريد الإلكتروني
                    </label>
                    <input
                        id="tenant-email"
                        type="email"
                        value={tenantEmail}
                        onChange={(e) => onEmailChange(e.target.value)}
                        onBlur={onEmailBlur}
                        className={inputClasses}
                        placeholder="name@example.com"
                        autoComplete="email"
                        aria-invalid={Boolean(errors?.tenantEmail)}
                        aria-describedby={errors?.tenantEmail ? 'tenant-email-error' : undefined}
                    />
                    {errors?.tenantEmail ? (
                        <p id="tenant-email-error" className={errorClasses}>{errors.tenantEmail}</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
