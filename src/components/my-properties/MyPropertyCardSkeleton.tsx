import { cn } from '@/lib/utils';

type MyPropertyCardSkeletonProps = {
    layout?: 'mobile' | 'grid' | 'list';
};

export default function MyPropertyCardSkeleton({
    layout = 'mobile',
}: MyPropertyCardSkeletonProps) {
    if (layout === 'grid') {
        return (
            <div className="overflow-hidden rounded-[1.8rem] border border-white/70 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="aspect-[4/3] w-full animate-pulse rounded-[1.35rem] bg-gray-200 dark:bg-white/10" />
                <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="h-6 w-1/2 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
                        <div className="h-8 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                    </div>
                    <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                    <div className="flex gap-2">
                        <div className="h-8 flex-1 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                        <div className="h-8 flex-1 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                    </div>
                    <div className="h-10 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'overflow-hidden rounded-[1.8rem] border border-white/70 bg-white/85 p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]',
                layout === 'list' && 'flex gap-4',
            )}
        >
            <div
                className={cn(
                    'animate-pulse rounded-[1.35rem] bg-gray-200 dark:bg-white/10',
                    layout === 'list' ? 'h-40 w-44 shrink-0' : 'aspect-[4/3] w-full',
                )}
            />
            <div className="mt-4 flex-1 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="h-6 w-1/2 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
                    <div className="h-8 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                </div>
                <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                <div className="flex gap-2">
                    <div className="h-8 flex-1 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                    <div className="h-8 flex-1 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                </div>
                <div className="h-10 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
            </div>
        </div>
    );
}
