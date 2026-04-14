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
      className={cn('block w-full cursor-pointer text-right group', className)}
    >
      <div className="flex min-h-[4rem] items-center rounded-[1.75rem] border border-white/60 bg-white/70 px-3 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-white/80 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-zinc-900/60 dark:group-hover:bg-zinc-900/80 md:min-h-[5rem] md:rounded-[2rem] md:px-4 md:py-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-500 transition-colors group-hover:bg-slate-900/10 group-hover:text-slate-900 dark:bg-white/10 dark:text-white/80 dark:group-hover:text-white md:h-12 md:w-12">
          <span className="material-symbols-outlined text-[1.4rem] md:text-[1.8rem]">search</span>
        </div>

        <div className="min-w-0 flex-1 px-3 md:px-4">
          <div className="w-full truncate bg-transparent text-sm font-extrabold text-slate-800 dark:text-white/90 md:text-xl">
            ابحث عن شاليه، فيلا، أو شقة...
          </div>
        </div>

        <div className="mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-700 md:h-14 md:w-14">
          <span className="material-symbols-outlined text-[1.35rem] md:text-[1.6rem]">
            tune
          </span>
        </div>
      </div>
    </button>
  );
}
