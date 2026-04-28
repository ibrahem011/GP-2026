'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from 'react';
import OwnerDetailsStep from '@/components/add-property/OwnerDetailsStep';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PROPERTY_FEATURES } from '@/config/features';
import { useAuth } from '@/context/AuthContext';
import {
    buildPropertyInsertPayload,
    validatePropertyDraft,
    type PropertyDraftErrors,
    type PropertyDraftField,
} from '@/lib/propertyDraft';
import type { PropertyLocationValue } from '@/lib/propertyAreas';
import { addNotification, getCurrentUser } from '@/lib/storage';
import { supabaseService } from '@/services/supabaseService';
import { normalizeLocalizedDigits, sanitizePhoneInput } from '@/utils/validation';
import {
    AREAS,
    CATEGORY_AR,
    PRICE_UNIT_AR,
    type PriceUnit,
    type PropertyCategory,
    type User,
} from '@/types';

const DynamicLocationPicker = dynamic(() => import('@/components/add-property/LocationPicker'), {
    ssr: false,
    loading: () => (
        <div className="relative z-0 h-[350px] overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-800">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800" />
        </div>
    ),
});

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
};

type AddPropertyFormData = {
    title: string;
    description: string;
    price: string;
    priceUnit: PriceUnit;
    category: PropertyCategory;
    bedrooms: string;
    bathrooms: string;
    area: string;
    floor: string;
    features: string[];
    address: string;
    selectedArea: string;
    ownerName: string;
    ownerPhone: string;
};

type OwnerSource = {
    id: string;
    name: string;
    phone: string;
    isVerified: boolean;
};

const FALLBACK_OWNER = {
    name: 'إبراهيم',
    isVerified: false,
} as const;

const CATEGORIES: PropertyCategory[] = ['apartment', 'room', 'studio', 'villa', 'chalet'];
const PRICE_UNITS: PriceUnit[] = ['day', 'week', 'month', 'season'];
const STEP_FIELDS: Record<number, PropertyDraftField[]> = {
    1: ['title', 'price'],
    2: ['description', 'bedrooms', 'bathrooms', 'area', 'floor'],
    3: ['selectedArea', 'address', 'location'],
    4: ['ownerName', 'ownerPhone'],
};

type NumericFieldName = 'price' | 'bedrooms' | 'bathrooms' | 'area' | 'floor';
type SubmitStage = 'idle' | 'preparing' | 'uploading' | 'saving';

type StagedImage = {
    id: string;
    file: File;
    previewUrl: string;
};

function sanitizeNumericInput(value: string): string {
    return normalizeLocalizedDigits(value).replace(/[^\d]/g, '');
}

function isPriceUnitValue(value: string): value is PriceUnit {
    return PRICE_UNITS.includes(value as PriceUnit);
}

function getSubmitStageLabel(stage: SubmitStage): string {
    switch (stage) {
        case 'preparing':
            return 'جارٍ تجهيز الإعلان...';
        case 'uploading':
            return 'جارٍ رفع الصور...';
        case 'saving':
            return 'جارٍ حفظ بيانات العقار...';
        default:
            return 'نشر العقار';
    }
}

function getSubmitErrorMessage(error: unknown): string {
    const maybeError = error as { code?: string; message?: string } | null | undefined;

    switch (maybeError?.code) {
        case 'SESSION_EXPIRED':
            return 'انتهت جلسة تسجيل الدخول. سجّل الدخول مرة أخرى ثم أعد المحاولة.';
        case 'SESSION_MISMATCH':
            return 'الحساب الحالي لا يطابق حساب مالك العقار. تأكد من تسجيل الدخول بالحساب الصحيح.';
        case 'REQUEST_TIMEOUT':
            return 'استغرقت العملية وقتًا أطول من المتوقع. تأكد من الاتصال بالإنترنت ثم حاول مرة أخرى.';
        case 'UPLOAD_FAILED':
            return 'فشل رفع الصور. حاول مرة أخرى أو قلّل عدد الصور وحجمها.';
        case 'SAVE_FAILED':
            return 'تعذر حفظ بيانات العقار بعد رفع الصور. حاول مرة أخرى بعد قليل.';
        default:
            return maybeError?.message || 'حدث خطأ أثناء إضافة العقار. يرجى المحاولة مرة أخرى.';
    }
}

function createInitialFormData(owner?: Pick<OwnerSource, 'name' | 'phone'>): AddPropertyFormData {
    return {
        title: '',
        description: '',
        price: '',
        priceUnit: 'day',
        category: 'apartment',
        bedrooms: '1',
        bathrooms: '1',
        area: '',
        floor: '0',
        features: [],
        address: '',
        selectedArea: '',
        ownerName: owner?.name ?? '',
        ownerPhone: owner?.phone ?? '',
    };
}

function InputField({ label, error, className, ...props }: InputFieldProps) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{label}</label>
            <input
                className={[
                    'w-full rounded-xl border-2 bg-gray-50 p-4 text-gray-900 outline-none transition-all placeholder-gray-400 dark:bg-zinc-800 dark:text-white',
                    error
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-black',
                    className || '',
                ].join(' ')}
                {...props}
            />
            {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
    );
}

function pickStepErrors(step: number, errors: PropertyDraftErrors): PropertyDraftErrors {
    const allowedFields = STEP_FIELDS[step] ?? [];

    return allowedFields.reduce<PropertyDraftErrors>((acc, field) => {
        if (errors[field]) {
            acc[field] = errors[field];
        }
        return acc;
    }, {});
}

function getFirstInvalidStep(errors: PropertyDraftErrors): number {
    for (const [stepKey, fields] of Object.entries(STEP_FIELDS)) {
        if (fields.some((field) => Boolean(errors[field]))) {
            return Number(stepKey);
        }
    }

    return 4;
}

export default function AddPropertyPage() {
    const { user: authUser } = useAuth();
    const hasEditedOwnerNameRef = useRef(false);

    const [storedUser, setStoredUser] = useState<User | null>(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitStage, setSubmitStage] = useState<SubmitStage>('idle');
    const [validationErrors, setValidationErrors] = useState<PropertyDraftErrors>({});
    const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
    const [imageError, setImageError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<PropertyLocationValue | null>(null);
    const [formData, setFormData] = useState<AddPropertyFormData>(() => createInitialFormData());

    useEffect(() => {
        setStoredUser(getCurrentUser());
    }, []);

    useEffect(() => {
        return () => {
            stagedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        };
    }, [stagedImages]);

    const actualUser = useMemo<OwnerSource | null>(() => {
        if (authUser) {
            return {
                id: authUser.id,
                name: authUser.name,
                phone: authUser.phone,
                isVerified: authUser.isVerified,
            };
        }

        if (storedUser) {
            return {
                id: storedUser.id,
                name: storedUser.name,
                phone: storedUser.phone,
                isVerified: storedUser.isVerified,
            };
        }

        return null;
    }, [authUser, storedUser]);

    const ownerDetailsUser = useMemo(
        () =>
            actualUser
                ? {
                      name: actualUser.name,
                      isVerified: actualUser.isVerified,
                  }
                : FALLBACK_OWNER,
        [actualUser],
    );

    useEffect(() => {
        if (!actualUser?.name.trim()) {
            return;
        }

        setFormData((prev) => {
            if (actualUser.isVerified) {
                if (prev.ownerName === actualUser.name) {
                    return prev;
                }

                return { ...prev, ownerName: actualUser.name };
            }

            if (hasEditedOwnerNameRef.current || prev.ownerName.trim()) {
                return prev;
            }

            if (prev.ownerName === actualUser.name) {
                return prev;
            }

            return { ...prev, ownerName: actualUser.name };
        });
    }, [actualUser?.name, actualUser?.isVerified]);

    useEffect(() => {
        if (!actualUser?.phone.trim()) {
            return;
        }

        setFormData((prev) => {
            if (prev.ownerPhone.trim()) {
                return prev;
            }

            return { ...prev, ownerPhone: actualUser.phone };
        });
    }, [actualUser?.phone]);

    const clearValidationErrors = (...fields: PropertyDraftField[]) => {
        if (fields.length === 0) {
            return;
        }

        setValidationErrors((prev) => {
            let hasChanges = false;
            const next = { ...prev };

            for (const field of fields) {
                if (field in next) {
                    delete next[field];
                    hasChanges = true;
                }
            }

            return hasChanges ? next : prev;
        });
    };

    const clearSubmitFeedback = () => {
        setSubmitError(null);
    };

    const updateFormData = <K extends keyof AddPropertyFormData>(
        field: K,
        value: AddPropertyFormData[K],
        fieldsToClear: PropertyDraftField[] = [],
    ) => {
        clearSubmitFeedback();
        clearValidationErrors(...fieldsToClear);
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const updateNumericField = (field: NumericFieldName, rawValue: string) => {
        updateFormData(field, sanitizeNumericInput(rawValue) as AddPropertyFormData[typeof field], [field]);
    };

    const handlePriceUnitChange = (rawValue: string) => {
        clearSubmitFeedback();

        if (!isPriceUnitValue(rawValue)) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            priceUnit: prev.priceUnit === rawValue ? prev.priceUnit : rawValue,
        }));
    };

    const handleLocationSelect = (location: PropertyLocationValue) => {
        clearSubmitFeedback();
        clearValidationErrors('location');
        setSelectedLocation(location);
    };

    const handleLocationClear = () => {
        clearSubmitFeedback();
        clearValidationErrors('location');
        setSelectedLocation(null);
    };

    const handlePreviousStep = () => {
        clearSubmitFeedback();
        setStep((prev) => prev - 1);
    };

    const validateFiles = (files: FileList): { validFiles: File[]; error: string | null } => {
        const validFiles: File[] = [];
        const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        const maxFileSize = 5 * 1024 * 1024;
        const maxTotalImages = 6;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (!imageMimeTypes.includes(file.type)) {
                return { validFiles: [], error: 'يجب اختيار ملفات صور فقط' };
            }

            if (file.size > maxFileSize) {
                return { validFiles: [], error: 'حجم الملف يتجاوز 5 ميجابايت' };
            }

            validFiles.push(file);
        }

        if (stagedImages.length + validFiles.length > maxTotalImages) {
            return { validFiles: [], error: 'الحد الأقصى 6 صور' };
        }

        return { validFiles, error: null };
    };

    const handleFileSelect = (files: FileList) => {
        clearSubmitFeedback();
        setImageError(null);
        const { validFiles, error } = validateFiles(files);

        if (error) {
            setImageError(error);
            return;
        }

        const newImages: StagedImage[] = validFiles.map((file) => ({
            id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
            file,
            previewUrl: URL.createObjectURL(file),
        }));

        setStagedImages((prev) => [...prev, ...newImages]);
    };

    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            return;
        }

        handleFileSelect(files);
        event.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!loading && !uploading) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (loading || uploading) {
            return;
        }

        const files = e.dataTransfer.files;
        if (files.length === 0) {
            return;
        }

        handleFileSelect(files);
    };

    const removeImage = (id: string) => {
        clearSubmitFeedback();
        setStagedImages((prev) => {
            const imageToRemove = prev.find((img) => img.id === id);
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.previewUrl);
            }
            return prev.filter((img) => img.id !== id);
        });
    };

    const toggleFeature = (featureId: string) => {
        clearSubmitFeedback();
        setFormData((prev) => ({
            ...prev,
            features: prev.features.includes(featureId)
                ? prev.features.filter((item) => item !== featureId)
                : [...prev.features, featureId],
        }));
    };

    const handleNextStep = () => {
        clearSubmitFeedback();
        const { fieldErrors } = validatePropertyDraft(formData, selectedLocation);
        const stepErrors = pickStepErrors(step, fieldErrors);
        const hasStepErrors = Object.keys(stepErrors).length > 0;
        const isMissingImages = step === 1 && stagedImages.length === 0;

        if (isMissingImages) {
            setImageError('يرجى إضافة صورة واحدة على الأقل قبل الانتقال للخطوة التالية.');
        }

        if (hasStepErrors) {
            setValidationErrors(stepErrors);
        } else {
            setValidationErrors({});
        }

        if (hasStepErrors || isMissingImages) {
            return;
        }

        setStep((prev) => prev + 1);
    };

    const resetForm = () => {
        stagedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        hasEditedOwnerNameRef.current = false;
        setStep(1);
        setSuccess(false);
        setStagedImages([]);
        setImageError(null);
        setIsDragging(false);
        setSelectedLocation(null);
        setSubmitError(null);
        setSubmitStage('idle');
        setValidationErrors({});
        setFormData(createInitialFormData(actualUser ?? undefined));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setSubmitError(null);
        setSubmitStage('preparing');
        setValidationErrors({});

        try {
            if (!authUser) {
                setSubmitError('يجب تسجيل الدخول بحساب نشط قبل إضافة العقار.');
                return;
            }

            if (stagedImages.length === 0) {
                setImageError('يرجى إضافة صورة واحدة على الأقل قبل نشر العقار.');
                setStep(1);
                return;
            }

            const { normalizedData, fieldErrors } = validatePropertyDraft(formData, selectedLocation);
            if (!normalizedData) {
                setValidationErrors(fieldErrors);
                setStep(getFirstInvalidStep(fieldErrors));
                return;
            }

            const payload = buildPropertyInsertPayload(normalizedData);
            const newProperty = await supabaseService.createFullProperty(
                payload,
                stagedImages.map((img) => img.file),
                authUser.id,
                {
                    timeoutMs: 45_000,
                    maxRetries: 2,
                    onStageChange: (stage) => {
                        setSubmitStage(stage);
                        setUploading(stage === 'uploading');
                    },
                },
            );

            await addNotification({
                userId: authUser.id,
                title: 'تمت إضافة عقارك بنجاح!',
                message: `عقارك "${formData.title}" قيد المراجعة من الإدارة.`,
                type: 'success',
                link: `/property/${newProperty.id}`,
            });

            setSuccess(true);

            setTimeout(() => {
                window.location.href = '/my-properties';
            }, 2000);
        } catch (error: any) {
            console.error('Error adding property:', error);
            setSubmitError(getSubmitErrorMessage(error));
        } finally {
            setUploading(false);
            setLoading(false);
            setSubmitStage('idle');
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
                <div className="w-full max-w-md rounded-[2.5rem] border border-white/20 bg-white p-8 text-center shadow-2xl dark:bg-zinc-900">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
                        <span className="material-symbols-outlined animate-pulse text-6xl text-green-500">check_circle</span>
                    </div>
                    <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">تمت إضافة العقار بنجاح!</h1>
                    <p className="mb-8 text-gray-500 dark:text-gray-400">سيتم مراجعة العقار من الإدارة قبل نشره للعامة.</p>
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/"
                            className="w-full rounded-xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50"
                        >
                            العودة للرئيسية
                        </Link>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="w-full rounded-xl bg-gray-100 py-4 font-bold text-gray-900 transition-all hover:bg-gray-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                        >
                            إضافة عقار آخر
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-gray-50 pb-32 dark:bg-black">
            <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-black/80">
                <div className="mx-auto max-w-2xl px-4 py-4">
                    <div className="mb-6 flex items-center justify-between">
                        <Link href="/" className="text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white">
                            <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
                        </Link>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">إضافة عقار جديد</h1>
                        <div className="w-6" />
                    </div>

                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                                    item <= step ? 'bg-primary' : 'bg-gray-200 dark:bg-zinc-800'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </header>

            <section className="mx-auto mt-8 max-w-2xl px-4">
                <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-900">
                    {step === 1 ? (
                        <div className="animate-fadeIn space-y-6">
                            <div className="mb-8 text-center">
                                <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">المعلومات الأساسية</h2>
                                <p className="text-gray-500 dark:text-gray-400">ابدأ بإدخال التفاصيل الرئيسية لعقارك.</p>
                            </div>

                            <InputField
                                label="عنوان العقار *"
                                placeholder="مثال: شقة فاخرة بإطلالة بحرية"
                                value={formData.title}
                                onChange={(event) => updateFormData('title', event.target.value, ['title'])}
                                error={validationErrors.title}
                            />

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">نوع العقار *</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {CATEGORIES.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => updateFormData('category', category)}
                                            className={`rounded-xl border-2 p-3 text-sm font-bold transition-all ${
                                                formData.category === category
                                                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                                    : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700'
                                            }`}
                                        >
                                            {CATEGORY_AR[category]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    label="السعر *"
                                    type="text"
                                    min={1}
                                    step={1}
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={formData.price}
                                    onChange={(event) => updateNumericField('price', event.target.value)}
                                    error={validationErrors.price}
                                />

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">لكل</label>
                                    <div className="relative">
                                        <select
                                            dir="rtl"
                                            value={formData.priceUnit}
                                            onChange={(event) => handlePriceUnitChange(event.target.value)}
                                            className="w-full appearance-none rounded-xl border-2 border-transparent bg-gray-50 p-4 pl-12 pr-4 text-right text-gray-900 outline-none [text-align-last:right] transition-all focus:border-primary/50 dark:bg-zinc-800 dark:text-white dark:focus:bg-black"
                                        >
                                            {PRICE_UNITS.map((unit) => (
                                                <option key={unit} value={unit}>
                                                    {PRICE_UNIT_AR[unit]}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            expand_more
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    صور العقار <span className="text-xs font-normal text-gray-400">(حتى 6 صور)</span>
                                </label>

                                {stagedImages.length === 0 ? (
                                    <label
                                        className={`group flex h-52 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-gray-50 transition-all dark:bg-zinc-800 ${
                                            isDragging
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-300 hover:border-primary hover:bg-primary/5 dark:border-zinc-700'
                                        } ${loading || uploading ? 'pointer-events-none opacity-50' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <span className="material-symbols-outlined mb-2 text-4xl text-gray-400 transition-colors group-hover:text-primary">
                                            add_a_photo
                                        </span>
                                        <span className="text-sm font-bold text-gray-500 transition-colors group-hover:text-primary dark:text-gray-400">
                                            إضافة صور (حتى 6)
                                        </span>
                                        <span className="mt-1 text-xs text-gray-400">اسحب وأفلت أو اضغط للاختيار</span>
                                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={loading || uploading} className="hidden" />
                                    </label>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-3">
                                            {stagedImages.map((image) => (
                                                <div key={image.id} className="group relative aspect-square overflow-hidden rounded-2xl">
                                                    <Image src={image.previewUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 33vw, 160px" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(image.id)}
                                                        disabled={loading || uploading}
                                                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-50"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                            {stagedImages.length < 6 && !loading && !uploading && (
                                                <label
                                                    className={`group flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-gray-50 transition-all dark:bg-zinc-800 ${
                                                        isDragging
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-gray-300 hover:border-primary hover:bg-primary/5 dark:border-zinc-700'
                                                    }`}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                >
                                                    <span className="material-symbols-outlined mb-1 text-3xl text-gray-400 transition-colors group-hover:text-primary">
                                                        add_a_photo
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-400 transition-colors group-hover:text-primary">إضافة</span>
                                                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={loading || uploading} className="hidden" />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {imageError ? (
                                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
                                        <span className="material-symbols-outlined text-[18px]">error</span>
                                        <span>{imageError}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    {step === 2 ? (
                        <div className="animate-fadeIn space-y-6">
                            <div className="mb-8 text-center">
                                <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">تفاصيل العقار</h2>
                                <p className="text-gray-500 dark:text-gray-400">صف عقارك بدقة لجذب المستأجرين.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">وصف العقار *</label>
                                <textarea
                                    placeholder="اكتب وصفاً تفصيلياً للعقار..."
                                    value={formData.description}
                                    onChange={(event) => updateFormData('description', event.target.value, ['description'])}
                                    className={`min-h-[150px] w-full resize-none rounded-xl border-2 bg-gray-50 p-4 text-gray-900 outline-none transition-all dark:bg-zinc-800 dark:text-white ${
                                        validationErrors.description
                                            ? 'border-red-500/50'
                                            : 'border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-black'
                                    }`}
                                />
                                {validationErrors.description ? <p className="text-xs text-red-500">{validationErrors.description}</p> : null}
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{formData.description.length} حرف</span>
                                    <span>يفضل 50+ حرف</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    label="عدد الغرف"
                                    type="text"
                                    min={0}
                                    max={20}
                                    step={1}
                                    inputMode="numeric"
                                    value={formData.bedrooms}
                                    onChange={(event) => updateNumericField('bedrooms', event.target.value)}
                                    error={validationErrors.bedrooms}
                                />
                                <InputField
                                    label="عدد الحمامات"
                                    type="text"
                                    min={0}
                                    max={20}
                                    step={1}
                                    inputMode="numeric"
                                    value={formData.bathrooms}
                                    onChange={(event) => updateNumericField('bathrooms', event.target.value)}
                                    error={validationErrors.bathrooms}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    label="المساحة (م²)"
                                    type="text"
                                    min={1}
                                    max={5000}
                                    step={1}
                                    inputMode="numeric"
                                    placeholder="مثال: 120"
                                    value={formData.area}
                                    onChange={(event) => updateNumericField('area', event.target.value)}
                                    error={validationErrors.area}
                                />
                                <InputField
                                    label="الدور"
                                    type="text"
                                    min={0}
                                    max={60}
                                    step={1}
                                    inputMode="numeric"
                                    placeholder="مثال: 3"
                                    value={formData.floor}
                                    onChange={(event) => updateNumericField('floor', event.target.value)}
                                    error={validationErrors.floor}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                        المميزات والخدمات
                                        <span className="ms-2 text-gray-400">
                                            ({formData.features.length}/{PROPERTY_FEATURES.length})
                                        </span>
                                    </label>

                                    {formData.features.length > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => updateFormData('features', [])}
                                            className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            مسح الكل
                                        </button>
                                    ) : null}
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {PROPERTY_FEATURES.map((feature) => {
                                        const active = formData.features.includes(feature.id);

                                        return (
                                            <button
                                                key={feature.id}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => toggleFeature(feature.id)}
                                                className={[
                                                    'select-none rounded-xl border-2 p-3 text-sm font-bold transition-all',
                                                    active
                                                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                                        : 'border-transparent bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700',
                                                ].join(' ')}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[18px]">{feature.icon}</span>
                                                    <span>{feature.label}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    اختر المميزات الموجودة فعلاً، لأن ذلك يرفع جودة الإعلان ويزيد ثقة المستأجرين.
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {step === 3 ? (
                        <div className="animate-fadeIn space-y-6">
                            <div className="mb-8 text-center">
                                <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">الموقع</h2>
                                <p className="text-gray-500 dark:text-gray-400">حدد المنطقة والعنوان والموقع التقريبي للعقار.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">المنطقة *</label>
                                <div className="relative">
                                    <select
                                        dir="rtl"
                                        value={formData.selectedArea}
                                        onChange={(event) =>
                                            updateFormData('selectedArea', event.target.value, ['selectedArea', 'location'])
                                        }
                                        className={`w-full appearance-none rounded-xl border-2 bg-gray-50 p-4 pl-12 pr-4 text-right outline-none [text-align-last:right] transition-all ${
                                            !formData.selectedArea ? 'text-gray-400' : 'text-gray-900 dark:text-white'
                                        } ${
                                            validationErrors.selectedArea
                                                ? 'border-red-500/50'
                                                : 'border-transparent focus:border-primary/50'
                                        } dark:bg-zinc-800`}
                                    >
                                        <option value="">اختر المنطقة</option>
                                        {AREAS.map((area) => (
                                            <option key={area} value={area}>
                                                {area}
                                        </option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    expand_more
                                </span>
                                </div>
                                {validationErrors.selectedArea ? <p className="text-xs text-red-500">{validationErrors.selectedArea}</p> : null}
                            </div>

                            <InputField
                                label="العنوان التفصيلي *"
                                placeholder="مثال: شارع البحر، بجوار المسجد..."
                                value={formData.address}
                                onChange={(event) => updateFormData('address', event.target.value, ['address'])}
                                error={validationErrors.address}
                            />

                            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800 dark:border-blue-900/30 dark:bg-blue-950/10 dark:text-blue-200">
                                تحديد النقطة على الخريطة اختياري، لكن إذا أضفتها يجب أن تكون داخل نطاق المنطقة المختارة.
                            </div>

                            <DynamicLocationPicker
                                value={selectedLocation}
                                selectedArea={formData.selectedArea}
                                locationError={validationErrors.location}
                                onLocationSelect={handleLocationSelect}
                                onLocationClear={handleLocationClear}
                            />
                        </div>
                    ) : null}

                    {step === 4 ? (
                        <div className="animate-fadeIn space-y-6">
                            <div className="mb-8 text-center">
                                <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">بيانات التواصل</h2>
                                <p className="text-gray-500 dark:text-gray-400">حدد البيانات التي ستظهر للمستأجرين بعد فك القفل.</p>
                            </div>

                            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200">
                                <span className="material-symbols-outlined mt-0.5 shrink-0">lock</span>
                                <p>رقم هاتفك سيبقى مخفياً عن المستأجرين حتى يقوموا بدفع رسوم الخدمة لضمان الجدية.</p>
                            </div>

                            <OwnerDetailsStep
                                user={ownerDetailsUser}
                                value={formData.ownerName}
                                onChange={(name) => {
                                    hasEditedOwnerNameRef.current = true;
                                    updateFormData('ownerName', name, ['ownerName']);
                                }}
                            />

                            {validationErrors.ownerName ? (
                                <p className="-mt-2 text-xs text-red-500">{validationErrors.ownerName}</p>
                            ) : null}

                            <InputField
                                label="رقم الهاتف *"
                                type="tel"
                                placeholder="01xxxxxxxxx"
                                value={formData.ownerPhone}
                                onChange={(event) => updateFormData('ownerPhone', sanitizePhoneInput(event.target.value), ['ownerPhone'])}
                                dir="ltr"
                                className="text-right"
                                error={validationErrors.ownerPhone}
                            />

                            <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-white/5 dark:bg-zinc-800">
                                <h3 className="border-b border-gray-200 pb-2 font-bold text-gray-900 dark:border-white/10 dark:text-white">
                                    ملخص العقار
                                </h3>

                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <span className="text-gray-500">النوع:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{CATEGORY_AR[formData.category]}</span>

                                    <span className="text-gray-500">السعر:</span>
                                    <span className="font-bold text-primary">
                                        {formData.price || '0'} ج.م / {PRICE_UNIT_AR[formData.priceUnit]}
                                    </span>

                                    <span className="text-gray-500">المنطقة:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formData.selectedArea || 'غير محددة'}</span>

                                    <span className="text-gray-500">الموقع الدقيق:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {selectedLocation ? 'تم تحديده على الخريطة' : 'غير محدد'}
                                    </span>

                                    <span className="text-gray-500">الصور:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{stagedImages.length} صور</span>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </section>

            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/80 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-black/80">
                <div className="mx-auto max-w-2xl">
                    {step === 4 && submitError ? (
                        <div className="mb-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
                            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px]">error</span>
                            <p>{submitError}</p>
                        </div>
                    ) : null}

                    <div className="flex gap-4">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={handlePreviousStep}
                            className="flex-1 rounded-2xl bg-gray-100 py-4 font-bold text-gray-900 transition-all hover:bg-gray-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                        >
                            السابق
                        </button>
                    ) : null}

                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={handleNextStep}
                            className="flex-[2] rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                        >
                            التالي
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || uploading}
                            className="flex-[2] rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                        >
                            {loading || uploading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    {getSubmitStageLabel(submitStage)}
                                </span>
                            ) : (
                                'نشر العقار'
                            )}
                        </button>
                    )}
                </div>
            </div>
            </div>
            </main>
        </ProtectedRoute>
    );
}
