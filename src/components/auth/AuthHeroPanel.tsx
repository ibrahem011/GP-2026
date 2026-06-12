'use client';

import { useState } from 'react';

export default function AuthHeroPanel() {
    const [imageFailed, setImageFailed] = useState(false);

    return (
        <aside className="relative hidden h-full min-h-[700px] overflow-hidden lg:flex">
            {!imageFailed ? (
                <img
                    src="/photo_2026-03-07_14-36-50.jpg"
                    alt="Gamasa skyline and sailboat"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-sky-800 via-sky-600 to-cyan-700" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/35 to-sky-900/30" />
            <div className="absolute inset-0 bg-sky-900/15 mix-blend-multiply" />

            <div
                dir="rtl"
                className="relative z-10 flex h-full w-full flex-col items-start justify-end p-10 text-right text-white xl:p-12"
            >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-md">
                    <span aria-hidden="true" className="material-symbols-outlined text-3xl">home_work</span>
                </div>

                <h2 className="max-w-xl text-4xl font-black leading-tight drop-shadow-md xl:text-5xl">
                    استثمر في مستقبلك مع عقارات جمصة
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 xl:text-lg">
                    عقارات جمصة - بوابتك للاستثمار العقاري الفاخر على ساحل المتوسط.
                </p>

                <div className="mt-10 grid w-full max-w-lg grid-cols-3 gap-6">
                    <div>
                        <p className="text-3xl font-extrabold">+500</p>
                        <p className="mt-1 text-xs tracking-wider text-white/80">وحدة عقارية</p>
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold">+10</p>
                        <p className="mt-1 text-xs tracking-wider text-white/80">سنوات خبرة</p>
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold">24/7</p>
                        <p className="mt-1 text-xs tracking-wider text-white/80">دعم فني</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
