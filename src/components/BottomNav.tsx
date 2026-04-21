"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';

type NavItem = {
    href: string;
    label: string;
    icon: string;
    requiresAuth?: boolean;
};

const navItems: NavItem[] = [
    { href: "/", label: "الرئيسية", icon: "home" },
    { href: "/search", label: "بحث", icon: "search" },
    { href: "/add-property", label: "أضف عقار", icon: "add_circle", requiresAuth: true },
    { href: "/favorites", label: "المفضلة", icon: "favorite", requiresAuth: true },
    { href: "/profile", label: "حسابي", icon: "person", requiresAuth: true },
];

export function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated } = useAuth() || { isAuthenticated: false };

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
        if (item.requiresAuth && !isAuthenticated) {
            e.preventDefault();
            router.push(`/auth?redirect=${encodeURIComponent(item.href)}`);
        }
    };

    return (
        <nav className="w-full px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 pointer-events-none flex justify-center">
            <div
                className="
                    pointer-events-auto
                    relative
                    flex items-center justify-around w-[96%] max-w-[500px]
                    rounded-[24px]
                    border border-gray-200/80 dark:border-white/10
                    bg-white/95 dark:bg-[#18181b]/95
                    backdrop-blur-xl
                    shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                    px-1 py-1
                "
                style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom))' }}
            >
                {navItems.map((item) => {
                    const isActive =
                        item.href === '/'
                            ? pathname === '/'
                            : pathname?.startsWith(item.href);

                    const isAddProperty = item.href === '/add-property';

                    if (isAddProperty) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={(e) => handleNavigation(e, item)}
                                className="group relative flex flex-col flex-1 items-center justify-end h-16 transition-all duration-300 outline-none z-20"
                            >
                                <div className="absolute -top-[28px] flex items-center justify-center w-[60px] h-[60px] bg-[#3b82f6] text-white rounded-full shadow-[0_8px_20px_rgba(59,130,246,0.35)] border-[4px] border-white dark:border-[#18181b] transition-transform duration-300 group-hover:-translate-y-1 group-active:scale-95">
                                    <span className="material-symbols-outlined text-[36px] font-light leading-none" aria-hidden="true">
                                        add
                                    </span>
                                </div>
                                <span
                                    className="mb-1 text-[11px] font-medium tracking-tight whitespace-nowrap text-zinc-500 dark:text-zinc-400 group-hover:text-[#3b82f6] transition-colors"
                                    style={{ fontFamily: 'Noto Sans Arabic, system-ui' }}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    }

                    const iconStyle: React.CSSProperties = isActive
                        ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
                        : { fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" };

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={(e) => handleNavigation(e, item)}
                            className={`group relative flex flex-col flex-1 items-center justify-center h-16 transition-all duration-300 ease-out active:scale-95 ${isActive ? '-translate-y-1' : 'hover:-translate-y-0.5'
                                }`}
                        >
                            <span
                                className={`material-symbols-outlined text-[26px] leading-none transition-all duration-300 ${isActive
                                    ? 'text-[#3b82f6] drop-shadow-[0_2px_8px_rgba(59,130,246,0.4)]'
                                    : 'text-zinc-500 dark:text-zinc-400 group-hover:text-[#3b82f6]'
                                    }`}
                                style={iconStyle}
                                aria-hidden="true"
                            >
                                {item.icon}
                            </span>

                            <span
                                className={`mt-1 text-[11px] font-medium tracking-tight whitespace-nowrap transition-colors duration-300 ${isActive
                                    ? 'text-[#3b82f6] font-bold'
                                    : 'text-zinc-500 dark:text-zinc-400 group-hover:text-[#3b82f6]'
                                    }`}
                                style={{ fontFamily: 'Noto Sans Arabic, system-ui' }}
                            >
                                {item.label}
                            </span>

                            {/* Active Indicator */}
                            <span
                                className={`absolute bottom-1 h-[3px] w-8 rounded-full transition-all duration-300 ${isActive ? 'opacity-100 bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'opacity-0 scale-50'
                                    }`}
                            />
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
