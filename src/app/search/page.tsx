import { Metadata } from 'next';
import { normalizeFeatureIds } from '@/config/features';
import { isPropertyCollection } from '@/lib/propertyCollections';
import { fromPropertyRow } from '@/lib/propertyMapper';
import { supabaseService } from '@/services/supabaseService';
import SearchPageClient from './client';
import { Property } from '@/types';

export const metadata: Metadata = {
  title: 'بحث عن عقارات في جمصة - ابحث بالسعر، المنطقة، والمساحة',
  description:
    'ابحث عن شاليهات، فيلات، وشقق للإيجار في جمصة. فلتر حسب السعر، عدد الغرف، والموقع. احجز عقارك المثالي.',
  keywords: ['بحث عقارات جمصة', 'بحث شاليهات', 'فلتر عقارات', 'إيجار جمصة', 'بحث بالإيجار'],
};

async function getInitialProperties(searchParams: {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  area?: string;
  features?: string;
  collection?: string;
  page?: string;
}): Promise<{ properties: Property[]; hasMore: boolean }> {
  try {
    const PAGE_SIZE = 12;
    const page = Math.max(1, Number(searchParams.page || '1') || 1);
    const offset = (page - 1) * PAGE_SIZE;
    const collection = isPropertyCollection(searchParams.collection)
      ? searchParams.collection
      : undefined;

    const filters: Parameters<typeof supabaseService.getProperties>[0] = { status: 'available' };

    if (searchParams.category && searchParams.category !== 'all') filters.category = searchParams.category;
    if (searchParams.minPrice) filters.minPrice = Number(searchParams.minPrice);
    if (searchParams.maxPrice) filters.maxPrice = Number(searchParams.maxPrice);
    if (searchParams.bedrooms) filters.bedrooms = Number(searchParams.bedrooms);
    if (searchParams.bathrooms) filters.bathrooms = Number(searchParams.bathrooms);

    if (searchParams.area && searchParams.area !== 'all' && searchParams.area !== 'الكل') {
      filters.area = searchParams.area;
    }

    if (searchParams.features) {
      filters.features = normalizeFeatureIds(
        searchParams.features
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      );
    }

    if (searchParams.q && searchParams.q.trim()) filters.q = searchParams.q.trim();
    if (collection) filters.collection = collection;

    const rows = await supabaseService.getProperties({
      ...filters,
      limit: PAGE_SIZE + 1,
      offset,
      timeoutMs: 10_000,
      logLevel: 'warn',
    });

    const hasMore = rows.length > PAGE_SIZE;
    const slice = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    const properties: Property[] = slice.map(fromPropertyRow);

    return { properties, hasMore };
  } catch (error) {
    console.warn('Failed to fetch initial properties:', error);
    return { properties: [], hasMore: false };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    area?: string;
    features?: string;
    collection?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const { properties: initialProperties } = await getInitialProperties(sp);

  return (
    <SearchPageClient
      initialProperties={initialProperties}
      initialSearchParams={sp}
    />
  );
}
