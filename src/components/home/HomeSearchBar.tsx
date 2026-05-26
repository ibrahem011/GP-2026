'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type HomeSearchBarProps = {
  className?: string;
};

export default function HomeSearchBar({ className }: HomeSearchBarProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push('/search')}
      aria-label="ابحث عن عقار للإيجار في جمصة"
      className={cn(
        'group relative z-20 block w-full cursor-pointer rounded-[1.5rem] text-right focus-visible:ring-2 focus-visible:ring-primary/60 md:rounded-[1.75rem]',
        className,
      )}
    >
      <div className="flex min-h-16 items-center rounded-[1.5rem] border border-primary/25 bg-surface-light px-3 py-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.10)] transition-colors duration-200 group-hover:border-primary/45 dark:border-primary/25 dark:bg-surface-dark dark:group-hover:border-primary/45 md:min-h-[4.5rem] md:rounded-[1.75rem] md:px-4 md:py-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-slate-50 transition-colors group-hover:bg-blue-600">
          <span className="material-symbols-outlined text-[1.35rem] md:text-[1.55rem]">search</span>
        </div>

        <div className="min-w-0 flex-1 px-3 md:px-4">
          <div className="w-full truncate bg-transparent text-sm font-bold text-slate-800 dark:text-slate-50 sm:text-base md:text-lg">
            ابحث عن شاليه أو فيلا أو شقة
          </div>
        </div>

        <div className="ms-2 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/15 dark:bg-primary/20 dark:text-blue-300 md:size-12">
          <span className="material-symbols-outlined text-[1.25rem] md:text-[1.4rem]">
            tune
          </span>
        </div>
      </div>
    </button>
  );
}
