'use client';

import Link from 'next/link';
import { PropertyCard } from '@/components/PropertyCard';
import { getHomeSectionLayoutMode } from '@/lib/propertyCollections';
import type { Property } from '@/types';

type HomeCardVariant = 'default' | 'spotlight';

interface HomePropertySectionProps {
  title: string;
  href: string;
  linkLabel: string;
  icon: string;
  iconClassName: string;
  properties: Property[];
  emptyMessage: string;
}

function toPropertyCardProps(property: Property, variant: HomeCardVariant = 'default') {
  return {
    id: property.id,
    title: property.title,
    location: property.location.address || property.location.area,
    price: property.price,
    priceUnit: property.priceUnit,
    image: property.images[0] || '',
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    isVerified: property.isVerified,
    category: property.category,
    variant,
  };
}

export default function HomePropertySection({
  title,
  href,
  linkLabel,
  icon,
  iconClassName,
  properties,
  emptyMessage,
}: HomePropertySectionProps) {
  const layoutMode = getHomeSectionLayoutMode(properties.length);
  const hasProperties = properties.length > 0;

  return (
    <section className="w-full">
      <div className="mb-5 flex items-start justify-between gap-3 md:mb-6 md:items-end">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${iconClassName}`}
          >
            <span className="material-symbols-outlined text-[19px]">{icon}</span>
          </div>
          <h2 className="text-balance-ar text-xl font-extrabold text-slate-900 dark:text-slate-50 sm:text-[1.55rem]">
            {title}
          </h2>
        </div>

        <Link
          href={href}
          className="group inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-primary/60 dark:hover:text-blue-300"
        >
          {linkLabel}
          <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1 rtl:rotate-180">
            arrow_forward
          </span>
        </Link>
      </div>

      {hasProperties ? (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-6 hide-scrollbar md:hidden">
          {properties.map((property) => (
            <div key={property.id} className="w-[min(82vw,20rem)] shrink-0 snap-center">
              <PropertyCard {...toPropertyCardProps(property)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border-light bg-surface-light/80 p-5 text-center text-sm font-semibold text-text-muted dark:border-border-dark dark:bg-surface-dark/70 dark:text-slate-300">
          {emptyMessage}
        </div>
      )}

      {layoutMode === 'spotlight-single' ? (
        <div className="hidden md:block">
          {properties[0] ? (
            <PropertyCard {...toPropertyCardProps(properties[0], 'spotlight')} />
          ) : null}
        </div>
      ) : null}

      {layoutMode === 'spotlight-grid' ? (
        <div className="hidden gap-6 md:grid md:grid-cols-2 lg:gap-7">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              {...toPropertyCardProps(property, 'spotlight')}
            />
          ))}
        </div>
      ) : null}

      {layoutMode === 'standard-grid' ? (
        <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property) => (
            <PropertyCard key={property.id} {...toPropertyCardProps(property)} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
