import { Metadata } from 'next';
import Link from 'next/link';
import { PropertyCard } from '@/components/PropertyCard';
import HomeSearchBar from '@/components/home/HomeSearchBar';
import {
  buildHomeRecentProperties,
  getHomeSectionLayoutMode,
} from '@/lib/propertyCollections';
import { fromPropertyRow } from '@/lib/propertyMapper';
import { supabaseService } from '@/services/supabaseService';
import type { Property } from '@/types';

const FEATURED_LIMIT = 5;
const RECENT_FETCH_LIMIT = 8;
const RECENT_HOME_LIMIT = 3;

export const metadata: Metadata = {
  title: 'عقارات جمصة - ابحث عن شاليهات، فيلات، وشقق للإيجار',
  description:
    'اكتشف أفضل العقارات للإيجار في جمصة. شاليهات، فيلات، وشقق عصرية بأسعار تنافسية. احجز الآن واستمتع بإجازتك.',
  keywords: [
    'عقارات جمصة',
    'شاليهات جمصة',
    'فيلات جمصة',
    'شقق للإيجار جمصة',
    'إيجار عطلات جمصة',
  ],
  openGraph: {
    title: 'عقارات جمصة - أفضل الإيجارات السكنية',
    description: 'اكتشف أفضل العقارات للإيجار في جمصة',
    type: 'website',
    locale: 'ar_EG',
  },
};

type HomeCardVariant = 'default' | 'spotlight';

interface HomePropertySectionProps {
  title: string;
  href: string;
  icon: string;
  iconClassName: string;
  properties: Property[];
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

function HomePropertySection({
  title,
  href,
  icon,
  iconClassName,
  properties,
}: HomePropertySectionProps) {
  const layoutMode = getHomeSectionLayoutMode(properties.length);

  return (
    <section className="w-full">
      <div className="mb-5 flex items-end justify-between gap-4 md:mb-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-full border shadow-sm ${iconClassName}`}
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">{icon}</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-[1.65rem]">
            {title}
          </h2>
        </div>

        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary transition-all hover:text-blue-700 dark:hover:text-blue-400 md:text-[0.95rem]"
        >
          عرض الكل
          <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1 rtl:rotate-180">
            arrow_forward
          </span>
        </Link>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-6 hide-scrollbar md:hidden">
        {properties.map((property) => (
          <div key={property.id} className="w-[85vw] max-w-[280px] shrink-0 snap-center">
            <PropertyCard {...toPropertyCardProps(property)} />
          </div>
        ))}
      </div>

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

async function getHomeCollections() {
  const [featuredRows, recentRows] = await Promise.all([
    supabaseService.getProperties({
      status: 'available',
      collection: 'featured',
      limit: FEATURED_LIMIT,
      timeoutMs: 10_000,
      logLevel: 'warn',
    }),
    supabaseService.getProperties({
      status: 'available',
      collection: 'recent',
      limit: RECENT_FETCH_LIMIT,
      timeoutMs: 10_000,
      logLevel: 'warn',
    }),
  ]);

  const featuredProperties = featuredRows.map(fromPropertyRow);
  const recentProperties = buildHomeRecentProperties(
    featuredProperties,
    recentRows.map(fromPropertyRow),
    RECENT_HOME_LIMIT,
  );

  return { featuredProperties, recentProperties };
}

export default async function HomePage() {
  const { featuredProperties, recentProperties } = await getHomeCollections();

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-black md:pb-12">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/property4.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-slate-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_42%)] opacity-80" />

        <div className="relative mx-auto flex min-h-[28rem] max-w-6xl flex-col items-center px-4 pb-12 pt-24 text-center sm:min-h-[32rem] sm:px-6 md:min-h-[35rem] md:justify-start md:pb-24 md:pt-32 lg:min-h-[36rem] lg:pt-36">
          <div className="w-full max-w-[46rem]">
            <h1 className="mb-4 text-4xl font-black leading-[1.15] text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-[4.4rem]">
              اكتشف عقار أحلامك في{' '}
              <span className="text-primary drop-shadow-none">
                جمصة
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-sm font-medium leading-7 text-slate-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] sm:text-base md:text-[1.05rem]">
              شاليهات، فيلات، وشقق عصرية بأسعار تنافسية. احجز الآن واستمتع بإجازتك.
            </p>
          </div>

          <HomeSearchBar className="mt-4 w-full max-w-5xl translate-y-6 md:mt-10 md:translate-y-20" />
        </div>
      </section>

      <div className="relative z-10 -mt-16 rounded-t-[32px] bg-gray-50 pt-10 shadow-[0_-20px_70px_rgba(15,23,42,0.08)] dark:bg-black dark:shadow-[0_-24px_72px_rgba(0,0,0,0.45)] md:-mt-28 md:pt-12 lg:-mt-32 lg:pt-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 md:gap-14">
          <HomePropertySection
            title="مميز"
            href="/search?collection=featured"
            icon="star"
            iconClassName="border-blue-100 bg-blue-50 text-primary dark:border-blue-500/20 dark:bg-blue-500/10"
            properties={featuredProperties}
          />

          <HomePropertySection
            title="حديث الإضافة"
            href="/search?collection=recent"
            icon="schedule"
            iconClassName="border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10"
            properties={recentProperties}
          />

          <section className="pb-2 md:pb-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 text-center text-white shadow-2xl transition-shadow duration-500 hover:shadow-primary/30 dark:from-primary/90 dark:to-primary/60 md:p-12">
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <div className="relative z-10 flex flex-col items-center">
                <h2 className="mb-4 text-3xl font-black md:text-4xl">
                  هل تملك عقاراً في جمصة؟
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-sm font-medium text-white/90 md:text-lg">
                  انشر عقارك في منصتنا واكتشف آلاف المستأجرين الباحثين عن إقامة مميزة. نحن
                  نوفر لك لوحة تحكم متكاملة لإدارة حجوزاتك بسهولة.
                </p>
                <Link
                  href="/add-property"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-white/95 px-8 py-4 text-lg font-extrabold text-primary shadow-xl ring-4 ring-white/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:ring-white/40 active:translate-y-0 active:scale-95"
                >
                  <span className="material-symbols-outlined text-2xl transition-transform group-hover:scale-110">add_home</span>
                  أضف عقارك الآن
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
