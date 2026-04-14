'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PropertyCard } from '@/components/PropertyCard';
import { normalizeFeatureIds } from '@/config/features';
import { isPropertyCollection } from '@/lib/propertyCollections';

import { Property } from '@/types';
import SearchFilters from '@/components/SearchFilters';
import MapView from '@/components/MapView';

import BottomSheet from '@/components/search/BottomSheet';
import FloatingActions from '@/components/search/FloatingActions';
import SortSheet, { SortOption } from '@/components/search/SortSheet';

type FiltersState = {
  category: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  area: string;
  features?: string; // csv
};

type SearchFiltersInput = {
  category?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  bedrooms?: string | number;
  bathrooms?: string | number;
  area?: string;
  features?: string[];
};

interface SearchPageClientProps {
  initialProperties: Property[];
  initialSearchParams: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    area?: string;
    features?: string;
    collection?: string;
  };
}

const normalizeFeatureCsv = (value?: string) => normalizeFeatureIds(value?.split(',') ?? []).join(',');

export default function SearchPageClient({ initialProperties, initialSearchParams }: SearchPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionParam = searchParams.get('collection');
  const collection = isPropertyCollection(collectionParam) ? collectionParam : null;

  const normalizeAll = (v?: string) => (!v || v === 'الكل' ? 'all' : v);
  const handleBack = () => router.back();

  const [properties, setProperties] = useState<Property[]>(initialProperties);

  const [searchQuery, setSearchQuery] = useState(initialSearchParams.q || '');

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [sort, setSort] = useState<SortOption>('newest');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState<FiltersState>({
    category: initialSearchParams.category || 'all',
    minPrice: initialSearchParams.minPrice || '',
    maxPrice: initialSearchParams.maxPrice || '',
    bedrooms: initialSearchParams.bedrooms || '',
    bathrooms: initialSearchParams.bathrooms || '',
    area: normalizeAll(initialSearchParams.area) || 'all',
    features: normalizeFeatureCsv(initialSearchParams.features),
  });

  // Sync client results when server props change
  useEffect(() => {
    setProperties(initialProperties);
  }, [initialProperties]);

  const buildUrl = (q: string, f: FiltersState) => {
    const params = new URLSearchParams();

    if (q) params.set('q', q);
    if (collection) params.set('collection', collection);

    if (f.category && f.category !== 'all') params.set('category', f.category);
    if (f.minPrice) params.set('minPrice', f.minPrice);
    if (f.maxPrice) params.set('maxPrice', f.maxPrice);
    if (f.bedrooms) params.set('bedrooms', f.bedrooms);
    if (f.bathrooms) params.set('bathrooms', f.bathrooms);
    if (f.area && f.area !== 'all') params.set('area', f.area);
    if (f.features) params.set('features', f.features);

    // sort يبقى client-side الآن (ممكن ننقله للـ server لاحقًا)
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    return newUrl;
  };

  // Debounce search input (UX أفضل للموبايل)
  useEffect(() => {
    const currentQ = searchParams.get('q') || '';
    const trimmed = searchQuery.trim();

    if (trimmed === currentQ) return;

    const t = setTimeout(() => {
      router.replace(buildUrl(trimmed, activeFilters));
    }, 400);

    return () => clearTimeout(t);
  }, [searchQuery, searchParams, router, activeFilters]);

  // Update state from URL when navigation occurs
  useEffect(() => {
    const current = Object.fromEntries(searchParams.entries());

    setActiveFilters({
      category: current.category || 'all',
      minPrice: current.minPrice || '',
      maxPrice: current.maxPrice || '',
      bedrooms: current.bedrooms || '',
      bathrooms: current.bathrooms || '',
      area: normalizeAll(current.area) || 'all',
      features: normalizeFeatureCsv(current.features),
    });

    setSearchQuery(current.q || '');
  }, [searchParams]);

  // Called from SearchFilters (debounced inside it)
  const handleFilterChange = (next: SearchFiltersInput) => {
    const featuresCsv = Array.isArray(next.features) ? next.features.join(',') : '';

    const merged: FiltersState = {
      category: next.category || 'all',
      minPrice: next.minPrice ? String(next.minPrice) : '',
      maxPrice: next.maxPrice ? String(next.maxPrice) : '',
      bedrooms: next.bedrooms ? String(next.bedrooms) : '',
      bathrooms: next.bathrooms ? String(next.bathrooms) : '',
      area: next.area ? String(next.area) : 'all',
      features: featuresCsv,
    };

    setActiveFilters(merged);
    router.replace(buildUrl(searchQuery.trim(), merged));
  };

  const appliedCount = useMemo(() => {
    let c = 0;
    if (activeFilters.category && activeFilters.category !== 'all') c++;
    if (activeFilters.area && activeFilters.area !== 'all') c++;
    if (activeFilters.minPrice) c++;
    if (activeFilters.maxPrice) c++;
    if (activeFilters.bedrooms) c++;
    if (activeFilters.bathrooms) c++;
    if (activeFilters.features) c++;
    return c;
  }, [activeFilters]);

  const sortedProperties = useMemo(() => {
    if (sort === 'newest') return properties;
    const copy = [...properties];
    if (sort === 'price_asc') copy.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'price_desc') copy.sort((a, b) => (b.price || 0) - (a.price || 0));
    return copy;
  }, [properties, sort]);

  return (
    <div className="min-h-screen bg-gray-50 pb-28 dark:bg-black md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl px-4 py-4 border-b border-gray-200 dark:border-white/10 transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center gap-3 xl:max-w-[1400px]">
          <button onClick={handleBack} className="h-11 w-11 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0" aria-label="رجوع">
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder="ابحث بالاسم أو المنطقة..."
              className="w-full p-4 pr-12 rounded-2xl bg-gray-100 dark:bg-white/10 border-2 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white transition-all outline-none shadow-sm placeholder-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              search
            </span>
          </div>
        </div>
      </div>

      {/* Desktop filters (optional) */}
      <div className="mx-auto hidden max-w-7xl px-4 py-4 md:block xl:max-w-[1400px]">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            عرض {sortedProperties.length} مسكن
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-4 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm">
              <span className="material-symbols-outlined text-[18px]">tune</span>
              فلترة {appliedCount > 0 && <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{appliedCount}</span>}
            </button>

            <button onClick={() => setViewMode(v => v === 'list' ? 'map' : 'list')} className="flex items-center gap-2 px-4 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm">
              <span className="material-symbols-outlined text-[18px]">{viewMode === 'list' ? 'map' : 'format_list_bulleted'}</span>
              {viewMode === 'list' ? 'الخريطة' : 'القائمة'}
            </button>

            <button onClick={() => setSort('newest')} className={`flex items-center gap-2 px-4 h-10 rounded-xl border text-sm ${sort === 'newest' ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 dark:border-white/10'}`}>
              <span className="material-symbols-outlined text-[18px]">schedule</span> الأحدث
            </button>

            <button onClick={() => setSort('price_asc')} className={`flex items-center gap-2 px-4 h-10 rounded-xl border text-sm ${sort === 'price_asc' ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 dark:border-white/10'}`}>
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span> الأقل سعرًا
            </button>

            <button onClick={() => setSort('price_desc')} className={`flex items-center gap-2 px-4 h-10 rounded-xl border text-sm ${sort === 'price_desc' ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 dark:border-white/10'}`}>
              <span className="material-symbols-outlined text-[18px]">arrow_downward</span> الأعلى سعرًا
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-4 xl:max-w-[1400px]">
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">
            {sortedProperties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                title={property.title}
                location={property.location.address || property.location.area}
                price={property.price}
                priceUnit={property.priceUnit}
                image={property.images[0] || ''}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                area={property.area}
                isVerified={property.isVerified}
                category={property.category}
              />
            ))}
          </div>
        ) : (
          <MapView properties={sortedProperties} />
        )}

        {sortedProperties.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد نتائج</h3>
            <p className="text-gray-600 dark:text-gray-400">جرب تعديل الفلاتر أو البحث بكلمات مختلفة</p>
          </div>
        )}
      </div>

      {/* Floating actions (mobile) */}
      <div className="md:hidden">
        <FloatingActions
          onOpenFilters={() => setIsFilterOpen(true)}
          onOpenSort={() => setIsSortOpen(true)}
          onToggleMap={() => setViewMode((v) => (v === 'list' ? 'map' : 'list'))}
          viewMode={viewMode}
          appliedCount={appliedCount}
          resultsCount={sortedProperties.length}
        />
      </div>

      {/* Filter sheet */}
      <BottomSheet
        open={isFilterOpen}
        title="عناصر التصفية"
        onClose={() => setIsFilterOpen(false)}
        footer={
          <button
            onClick={() => setIsFilterOpen(false)}
            className="w-full h-12 rounded-2xl bg-primary text-white font-bold"
          >
            عرض النتائج ({sortedProperties.length})
          </button>
        }
      >
        <SearchFilters
          onFilterChange={handleFilterChange}
          initialFilters={{
            category: activeFilters.category,
            minPrice: activeFilters.minPrice,
            maxPrice: activeFilters.maxPrice,
            bedrooms: activeFilters.bedrooms,
            bathrooms: activeFilters.bathrooms,
            area: activeFilters.area,
            features: activeFilters.features ? activeFilters.features.split(',') : [],
          }}
          variant="sheet"
          showHeader={false}
        />
      </BottomSheet>

      {/* Sort sheet */}
      <SortSheet
        open={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        value={sort}
        onChange={(v) => setSort(v)}
      />


    </div>
  );
}
