'use client';

import { useState, useEffect } from 'react';
import { normalizeFeatureIds, PROPERTY_FEATURES } from '@/config/features';
import { AREAS, PropertyCategory } from '@/types';

type Variant = 'panel' | 'sheet';

interface SearchFiltersProps {
  onFilterChange: (filters: any) => void;
  initialFilters?: any;
  variant?: Variant;
  showHeader?: boolean; // نخفيه داخل الـ BottomSheet
}

const CATEGORY_OPTIONS: { value: PropertyCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'الكل', icon: 'apps' },
  { value: 'apartment' as any, label: 'شقة', icon: 'apartment' },
  { value: 'villa' as any, label: 'فيلا', icon: 'holiday_village' },
  { value: 'chalet' as any, label: 'شاليه', icon: 'cabin' },
  { value: 'room' as any, label: 'غرفة', icon: 'bed' },
];

export default function SearchFilters({
  onFilterChange,
  initialFilters = {},
  variant = 'panel',
  showHeader = true,
}: SearchFiltersProps) {
  const normalizeAll = (v?: string) => (!v || v === 'الكل' ? 'all' : v);

  const [minPrice, setMinPrice] = useState<number>(Number(initialFilters.minPrice || 0));
  const [maxPrice, setMaxPrice] = useState<number>(Number(initialFilters.maxPrice || 5000));

  const [bedrooms, setBedrooms] = useState<number>(Number(initialFilters.bedrooms || 0));
  const [bathrooms, setBathrooms] = useState<number>(Number(initialFilters.bathrooms || 0));

  const [selectedArea, setSelectedArea] = useState<string>(normalizeAll(initialFilters.area));
  const [category, setCategory] = useState<PropertyCategory | 'all'>(initialFilters.category || 'all');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    normalizeFeatureIds(initialFilters.features || []),
  );
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Debounce filter changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange({
        minPrice: minPrice > 0 ? minPrice : undefined,
        maxPrice: maxPrice > 0 ? maxPrice : undefined,
        bedrooms: bedrooms || undefined,
        bathrooms: bathrooms || undefined,
        area: selectedArea === 'all' ? undefined : selectedArea,
        category: category === 'all' ? undefined : category,
        features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
      });
    }, 450);

    return () => clearTimeout(timeout);
  }, [minPrice, maxPrice, bedrooms, bathrooms, selectedArea, category, selectedFeatures, onFilterChange]);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((f) => f !== featureId) : [...prev, featureId]
    );
  };

  const resetAll = () => {
    setMinPrice(0);
    setMaxPrice(5000);
    setBedrooms(0);
    setBathrooms(0);
    setSelectedArea('all');
    setCategory('all');
    setSelectedFeatures([]);
    setShowAllFeatures(false);
  };

  const containerClass =
    variant === 'sheet'
      ? 'bg-transparent p-0 rounded-none border-0 shadow-none space-y-6'
      : 'bg-surface-light dark:bg-surface-dark p-6 rounded-3xl border border-border-light dark:border-border-dark shadow-xl shadow-gray-200/50 dark:shadow-none h-fit space-y-8 sticky top-32';

  return (
    <div className={containerClass}>
      {showHeader && (
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">الفلاتر</h3>
          <button onClick={resetAll} className="text-xs text-primary font-bold hover:underline">
            مسح الكل
          </button>
        </div>
      )}

      {/* Category */}
      <div id="filter-category">
        <h4 className="font-bold mb-3 flex items-center gap-2 text-sm text-slate-900 dark:text-white">
          <span className="material-symbols-outlined text-primary text-[18px]">category</span>
          نوع العقار
        </h4>
        <div className="flex gap-2 overflow-auto no-scrollbar pb-1">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setCategory(opt.value)}
              className={[
                'shrink-0 px-3 py-2 rounded-full border text-sm flex items-center gap-2 transition',
                category === opt.value
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div id="filter-price">
        <h4 className="font-bold mb-3 flex items-center gap-2 text-sm text-slate-900 dark:text-white">
          <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
          نطاق السعر
        </h4>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-slate-300">الحد الأدنى</label>
            <input
              inputMode="numeric"
              value={minPrice || ''}
              onChange={(e) => setMinPrice(Number(e.target.value || 0))}
              placeholder="0"
              className="w-full p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-slate-300">الحد الأقصى</label>
            <input
              inputMode="numeric"
              value={maxPrice || ''}
              onChange={(e) => setMaxPrice(Number(e.target.value || 0))}
              placeholder="5000"
              className="w-full p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        <input
          type="range"
          min="500"
          max="10000"
          step="500"
          value={Math.min(Math.max(maxPrice || 5000, 500), 10000)}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full h-2 bg-background-light dark:bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary"
        />

        <div className="flex gap-2 mt-3 overflow-auto no-scrollbar">
          {[2000, 3000, 5000, 8000, 10000].map((v) => (
            <button
              key={v}
              onClick={() => setMaxPrice(v)}
              className="shrink-0 px-3 py-2 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-slate-900 dark:text-white"
            >
              حتى {v.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Area */}
      <div id="filter-area">
        <h4 className="font-bold mb-3 flex items-center gap-2 text-sm text-slate-900 dark:text-white">
          <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
          المنطقة
        </h4>
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="w-full p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-slate-900 dark:text-white outline-none"
        >
          <option value="all">كل المناطق</option>
          {AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {/* Rooms */}
      <div id="filter-rooms" className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
          <div className="text-sm font-bold mb-3 text-slate-900 dark:text-white">غرف النوم</div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setBedrooms((v) => Math.max(0, v - 1))}
              className="h-10 w-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
              aria-label="تقليل عدد غرف النوم"
            >
              <span className="material-symbols-outlined" aria-hidden="true">remove</span>
            </button>
            <div className="text-lg font-bold">{bedrooms === 0 ? 'بدون تحديد' : `${bedrooms}+`}</div>
            <button
              onClick={() => setBedrooms((v) => Math.min(10, v + 1))}
              className="h-10 w-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
              aria-label="زيادة عدد غرف النوم"
            >
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
          <div className="text-sm font-bold mb-3 text-slate-900 dark:text-white">الحمامات</div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setBathrooms((v) => Math.max(0, v - 1))}
              className="h-10 w-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
              aria-label="تقليل عدد الحمامات"
            >
              <span className="material-symbols-outlined" aria-hidden="true">remove</span>
            </button>
            <div className="text-lg font-bold">{bathrooms === 0 ? 'بدون تحديد' : `${bathrooms}+`}</div>
            <button
              onClick={() => setBathrooms((v) => Math.min(10, v + 1))}
              className="h-10 w-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
              aria-label="زيادة عدد الحمامات"
            >
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="filter-features">
        <h4 className="font-bold mb-3 flex items-center gap-2 text-sm text-slate-900 dark:text-white">
          <span className="material-symbols-outlined text-primary text-[18px]">star</span>
          المميزات
        </h4>

        <div className="flex flex-wrap gap-2">
          {(showAllFeatures ? PROPERTY_FEATURES : PROPERTY_FEATURES.slice(0, 8)).map((feature) => (
            <button
              key={feature.id}
              onClick={() => toggleFeature(feature.id)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5',
                selectedFeatures.includes(feature.id)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-400',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[16px]">{feature.icon}</span>
              {feature.label}
            </button>
          ))}
        </div>

        {PROPERTY_FEATURES.length > 8 && (
          <button
            onClick={() => setShowAllFeatures((v) => !v)}
            className="mt-3 text-sm text-primary font-bold"
          >
            {showAllFeatures ? 'عرض أقل' : 'عرض المزيد'}
          </button>
        )}

        <button onClick={resetAll} className="mt-5 w-full h-11 rounded-2xl border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
          مسح الكل
        </button>
      </div>
    </div>
  );
}
