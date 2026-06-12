'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const categories = [
  { id: "all", icon: "apartment", label: "الكل" },
  { id: "chalet", icon: "beach_access", label: "شاليهات" },
  { id: "villa", icon: "home", label: "فيلات" },
  { id: "studio", icon: "weekend", label: "ستوديو" },
];

export function CategoryFilter() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");

  const go = (id: string) => {
    setActiveCategory(id);
    router.push(id === 'all' ? '/search' : `/search?category=${encodeURIComponent(id)}`);
  };

  return (
    <div className="px-4 py-4 max-w-5xl mx-auto">
      <div className="flex gap-3 overflow-x-auto hide-scrollbar md:overflow-visible md:justify-center md:flex-wrap">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => go(category.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${activeCategory === category.id
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-white/20'
              }`}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              {category.icon}
            </span>
            <span className="text-sm font-medium">{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}