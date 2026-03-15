import { ArrowUpDown, SlidersHorizontal, View, Grid3X3, List } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SortOption } from '@/hooks/usePropertyFilters';

interface PropertyFiltersProps {
    sortBy: SortOption;
    setSortBy: (sort: SortOption) => void;
    viewMode: 'list' | 'grid';
    setViewMode: (mode: 'list' | 'grid') => void;
}

export function PropertyFilters({ sortBy, setSortBy, viewMode, setViewMode }: PropertyFiltersProps) {
    return (
        <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)} dir="rtl">
                <SelectTrigger className="w-[180px] bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl h-10 px-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-zinc-700/60 transition-colors shadow-sm focus:ring-primary/20">
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        <SelectValue placeholder="الفرز حسب" />
                    </div>
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-xl shadow-xl">
                    <SelectGroup>
                        <SelectItem value="newest" className="cursor-pointer focus:bg-primary/5 focus:text-primary dark:focus:bg-white/5 rounded-lg my-0.5">الأحدث أولاً</SelectItem>
                        <SelectItem value="oldest" className="cursor-pointer focus:bg-primary/5 focus:text-primary dark:focus:bg-white/5 rounded-lg my-0.5">الأقدم أولاً</SelectItem>
                        <SelectItem value="views" className="cursor-pointer focus:bg-primary/5 focus:text-primary dark:focus:bg-white/5 rounded-lg my-0.5">الأكثر مشاهدة</SelectItem>
                        <SelectItem value="price_high" className="cursor-pointer focus:bg-primary/5 focus:text-primary dark:focus:bg-white/5 rounded-lg my-0.5">السعر: الأعلى</SelectItem>
                        <SelectItem value="price_low" className="cursor-pointer focus:bg-primary/5 focus:text-primary dark:focus:bg-white/5 rounded-lg my-0.5">السعر: الأقل</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

            <div className="flex bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-1 shadow-sm">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all duration-300 ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    title="عرض كقائمة"
                >
                    <List className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all duration-300 ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    title="عرض كشبكة"
                >
                    <Grid3X3 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
