import { Metadata } from 'next';
import Link from 'next/link';
import { PropertyCard } from '@/components/PropertyCard';
import HomeSearchBar from '@/components/home/HomeSearchBar';

// Mock data matches PropertyCardProps roughly
const featuredProperties = [
  {
    id: "682e1fec-b250-4af2-921c-c2fd88823211",
    title: "فيلا الواحة",
    location: "منطقة الفيلات، جمصة",
    price: 2000,
    priceUnit: "ليلة",
    image: "/images/property4.png",
    rating: 4.9,
    discount: 20,
    bedrooms: 4,
    bathrooms: 3,
    area: 350,
    isVerified: true
  },
  {
    id: "682e1fec-b250-4af2-921c-c2fd88823212",
    title: "ستوديو بانوراما",
    location: "شارع الكورنيش، جمصة",
    price: 850,
    priceUnit: "ليلة",
    image: "/images/property3.png",
    rating: 4.8,
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    isVerified: true
  },
  {
    id: "682e1fec-b250-4af2-921c-c2fd88823213",
    title: "شقة فندقية فاخرة",
    location: "منطقة 15 مايو، جمصة",
    price: 1200,
    priceUnit: "ليلة",
    image: "/images/property1.png",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    isVerified: true,
    rating: 4.7,
  },
  {
    id: "682e1fec-b250-4af2-921c-c2fd88823214",
    title: "شاليه عائلي",
    location: "الكورنيش، صف ثاني",
    price: 800,
    priceUnit: "ليلة",
    image: "/images/property2.png",
    bedrooms: 2,
    bathrooms: 1,
    area: 80,
    isVerified: false,
    rating: 4.5,
  },
  {
    id: "d9e832aa-24dd-4a7b-8bf1-e77a29dc8fdf",
    title: "شقة مصيفية",
    location: "جمصة البلد",
    price: 500,
    priceUnit: "ليلة",
    image: "/images/property1.png",
    bedrooms: 2,
    bathrooms: 1,
    area: 90,
    isVerified: false,
    rating: 4.0,
  }
];

const recentProperties = [
  {
    id: "f83b15ad-4d1a-4c22-b5e8-0b615baf30ad",
    title: "فيلا بإطلالة بحرية",
    location: "منطقة الشاطئ، جمصة",
    price: 1500,
    priceUnit: "ليلة",
    image: "/images/property4.png",
    bedrooms: 3,
    bathrooms: 2,
    area: 200,
    isVerified: true,
    rating: 4.9,
  },
  {
    id: "6aab7de8-ff7d-411a-8260-bc04bd8ae302",
    title: "شالية حديثة",
    location: "الكورنيش، جمصة",
    price: 650,
    priceUnit: "ليلة",
    image: "/images/property3.png",
    bedrooms: 2,
    bathrooms: 1,
    area: 75,
    isVerified: false,
    rating: 4.6,
  },
  {
    id: "9c3e4142-bebe-451e-8cd3-4cb82b9e6cbb",
    title: "شقة عائلية واسعة",
    location: "جمصة البلد",
    price: 750,
    priceUnit: "ليلة",
    image: "/images/property2.png",
    bedrooms: 3,
    bathrooms: 2,
    area: 140,
    isVerified: true,
    rating: 4.4,
  },
];

export const metadata: Metadata = {
  title: 'عقارات جمصة - ابحث عن شاليهات، فيلات، وشقق للإيجار',
  description: 'اكتشف أفضل العقارات للإيجار في جمصة. شاليهات، فيلات، وشقق عصرية بأسعار تنافسية. احجز الآن واستمتع بإجازتك.',
  keywords: ['عقارات جمصة', 'شاليهات جمصة', 'فيلات جمصة', 'شقق للإيجار جمصة', 'إجار عطلات جمصة'],
  openGraph: {
    title: 'عقارات جمصة - أفضل الإيجارات السكنية',
    description: 'اكتشف أفضل العقارات للإيجار في جمصة',
    type: 'website',
    locale: 'ar_EG',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-8 md:pb-12">

      {/* Hero Section (Desktop + Mobile) */}
      <section className="relative min-h-[50vh] md:min-h-[75vh] flex items-center justify-center pt-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/property4.png')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 via-80% to-gray-50/80 dark:to-black"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center text-center mt-[-40px]">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 md:mb-6 shadow-sm drop-shadow-md">
            اكتشف عقار أحلامك في جمصة
          </h1>
          <p className="text-white/90 text-sm md:text-xl max-w-2xl mb-8 md:mb-12 shadow-sm drop-shadow-sm font-medium">
            شاليهات، فيلات، وشقق عصرية بأسعار تنافسية. احجز الآن واستمتع بإجازتك.
          </p>

          {/* Premium Search Bar */}
          <HomeSearchBar />
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="px-4 py-8 md:py-12 max-w-7xl mx-auto xl:max-w-[1400px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">stars</span>
            </div>
            مميز
          </h2>
          <Link
            href="/search?featured=true"
            className="text-sm md:text-base text-primary hover:text-primary/80 font-bold transition-colors flex items-center gap-1 group"
          >
            عرض الكل
            <span className="material-symbols-outlined text-[18px] rtl:rotate-180 transition-transform group-hover:-translate-x-1">arrow_forward</span>
          </Link>
        </div>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 hide-scrollbar snap-x snap-mandatory md:hidden">
          {featuredProperties.map((property) => (
            <div key={property.id} className="w-[85vw] min-w-[85vw] max-w-[22rem] shrink-0 snap-start">
              <PropertyCard {...property} />
            </div>
          ))}
        </div>
        <div className="hidden gap-6 md:grid md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
          {featuredProperties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>
      </section>

      {/* Recent Properties Section */}
      <section className="px-4 py-8 md:py-12 max-w-7xl mx-auto xl:max-w-[1400px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">new_releases</span>
            </div>
            حديث الإضافة
          </h2>
          <Link
            href="/search?recent=true"
            className="text-sm md:text-base text-primary hover:text-primary/80 font-bold transition-colors flex items-center gap-1 group"
          >
            عرض الكل
            <span className="material-symbols-outlined text-[18px] rtl:rotate-180 transition-transform group-hover:-translate-x-1">arrow_forward</span>
          </Link>
        </div>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 hide-scrollbar snap-x snap-mandatory md:hidden">
          {recentProperties.map((property) => (
            <div key={property.id} className="w-[85vw] min-w-[85vw] max-w-[22rem] shrink-0 snap-start">
              <PropertyCard {...property} />
            </div>
          ))}
        </div>
        <div className="hidden gap-6 md:grid md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
          {recentProperties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-12 md:py-16 max-w-7xl mx-auto xl:max-w-[1400px]">
        <div className="bg-gradient-to-r from-primary to-primary/80 dark:from-primary/90 dark:to-primary/60 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl hover:shadow-primary/30 transition-shadow duration-500">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -right-24 -top-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">هل تملك عقاراً في جمصة؟</h2>
            <p className="text-white/90 text-sm md:text-lg mb-8 max-w-2xl mx-auto font-medium">
              انشر عقارك في منصتنا واكتآف من آلاف المستأجرين الباحثين عن إقامة مميزة. نحن نوفر لك لوحة تحكم متكاملة لمدارة حجوزاتك بسهولة.
            </p>
            <Link
              href="/add-property"
              className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all hover:scale-105 hover:shadow-xl active:scale-95"
            >
              <span className="material-symbols-outlined text-2xl">add_home</span>
              أضف عقارك الآن
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
