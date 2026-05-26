import { Metadata } from 'next';
import Link from 'next/link';
import HomePropertySection from '@/components/home/HomePropertySection';
import HomeSearchBar from '@/components/home/HomeSearchBar';
import { buildHomeRecentProperties } from '@/lib/propertyCollections';
import { fromPropertyRow } from '@/lib/propertyMapper';
import { supabaseService } from '@/services/supabaseService';

const FEATURED_LIMIT = 5;
const RECENT_FETCH_LIMIT = 8;
const RECENT_HOME_LIMIT = 4;

export const metadata: Metadata = {
  title: 'عقارات جمصة - ابحث عن شاليهات، فيلات، وشقق للإيجار',
  description:
    'ابحث عن شاليهات، فيلات، وشقق للإيجار في جمصة. قارن الأسعار والموقع واحجز العقار المناسب بسهولة.',
  keywords: [
    'عقارات جمصة',
    'شاليهات جمصة',
    'فيلات جمصة',
    'شقق للإيجار جمصة',
    'إيجار عطلات جمصة',
  ],
  openGraph: {
    title: 'عقارات جمصة - شاليهات وفيلات وشقق للإيجار',
    description: 'ابحث وقارن واحجز عقارات للإيجار في جمصة',
    type: 'website',
    locale: 'ar_EG',
  },
};

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
    <div className="min-h-screen bg-background-light pb-[calc(var(--chrome-bottom)+1rem)] dark:bg-background-dark md:pb-12">
      <section className="relative isolate z-20 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[url('/images/property4.png')] bg-cover bg-[center_35%]" />
        <div className="absolute inset-0 bg-slate-950/50 md:bg-slate-950/42" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background-light to-transparent dark:from-background-dark" />

        <div className="relative mx-auto flex min-h-[29rem] max-w-[90rem] flex-col justify-end px-4 pb-14 pt-28 text-start sm:min-h-[31rem] sm:px-6 md:min-h-[33rem] md:pb-20 md:pt-32 lg:min-h-[35rem] lg:px-10 xl:px-14">
          <div className="w-full max-w-[39rem]">
            <p className="mb-3 inline-flex rounded-full border border-slate-50/20 bg-slate-950/28 px-3 py-1 text-xs font-bold text-slate-100">
              بحث سريع لعقارات جمصة
            </p>
            <h1 className="text-balance-ar mb-4 text-[2.45rem] font-black leading-[1.12] text-slate-50 sm:text-[3.35rem] md:text-[4rem] lg:text-[4.4rem]">
              عقارات جمصة للإيجار
            </h1>
            <p className="max-w-xl text-base font-semibold leading-8 text-slate-100 md:text-[1.04rem]">
              قارن حسب السعر والموقع، ثم احفظ العقار المناسب أو احجزه من نفس الحساب.
            </p>
          </div>

          <HomeSearchBar className="mt-7 w-full max-w-4xl translate-y-7 md:mt-9 md:translate-y-10" />
        </div>
      </section>

      <div className="relative z-10 -mt-5 rounded-t-[24px] bg-background-light pt-11 dark:bg-background-dark md:-mt-6 md:pt-14">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-9 px-4 sm:px-6 md:gap-12 lg:px-10 xl:px-14">
          <HomePropertySection
            title="عقارات مميزة"
            href="/search?collection=featured"
            linkLabel="عرض المميزة"
            icon="star"
            iconClassName="border-blue-100 bg-blue-50 text-primary dark:border-blue-500/20 dark:bg-blue-500/10"
            properties={featuredProperties}
            emptyMessage="لا توجد عقارات مميزة الآن. افتح البحث لرؤية كل العقارات المتاحة في جمصة."
          />

          <HomePropertySection
            title="أحدث الإضافات"
            href="/search?collection=recent"
            linkLabel="عرض الأحدث"
            icon="schedule"
            iconClassName="border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10"
            properties={recentProperties}
            emptyMessage="لا توجد إضافات حديثة الآن. افتح البحث لمراجعة العقارات المتاحة."
          />

          <section className="pb-2 md:pb-4">
            <div className="grid gap-5 rounded-2xl border border-border-light bg-surface-light p-5 dark:border-border-dark dark:bg-surface-dark md:grid-cols-[1fr_auto] md:items-center md:p-7">
              <div>
                <h2 className="text-balance-ar text-2xl font-extrabold text-text-main dark:text-slate-50 md:text-3xl">
                  هل تملك عقارًا في جمصة؟
                </h2>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-text-muted dark:text-slate-300 md:text-base">
                  انشر عقارك ليصل إلى الباحثين عن إقامة في جمصة، وتابع الحجوزات والبيانات من لوحة تحكم واحدة.
                </p>
              </div>
              <Link
                href="/add-property"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-extrabold text-slate-50 transition-colors hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-primary/60 md:w-auto"
              >
                <span className="material-symbols-outlined text-[22px]">add_home</span>
                أضف عقارك الآن
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
