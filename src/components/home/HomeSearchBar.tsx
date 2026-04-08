'use client';

import { useRouter } from 'next/navigation';

export default function HomeSearchBar() {
    const router = useRouter();

    return (
        <button
            type="button"
            aria-label="ابحث عن عقارات"
            onClick={() => router.push('/search')}
            className="w-full max-w-3xl mx-auto mt-8 cursor-pointer group px-2 md:px-0 appearance-none text-right outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
        >
            <div className="bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-2xl rounded-2xl p-2 md:p-3 flex items-center transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-primary/20">

                {/* Search Icon Container */}
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white/80 group-hover:text-white transition-colors text-xl md:text-2xl" aria-hidden="true">search</span>
                </div>

                {/* Input Area (Fake Input) */}
                <div className="flex-1 px-2 overflow-hidden">
                    <div className="w-full bg-transparent text-white/90 font-medium text-sm md:text-lg text-right truncate">
                        ابحث عن شاليه، فيلا، أو شقة...
                    </div>
                </div>

                {/* Filter Button */}
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/20 dark:bg-white/10 rounded-xl group-hover:bg-white/30 transition-colors shrink-0 mr-2 border border-white/10">
                    <span className="material-symbols-outlined text-white text-[20px] md:text-[24px]" aria-hidden="true">tune</span>
                </div>
            </div>
        </button>
    );
}
