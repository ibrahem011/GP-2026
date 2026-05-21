"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const labelText = theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن';

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center size-10 rounded-full bg-background-light dark:bg-background-dark hover:bg-gray-200 dark:hover:bg-gray-700 text-text-main transition-all duration-300 active:scale-95 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary"
            aria-label={labelText}
            title={labelText}
        >
            <span
                className={`material-symbols-outlined text-[20px] transition-transform duration-500 ${theme === 'dark' ? 'rotate-180' : 'rotate-0'}`}
                aria-hidden="true"
            >
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
        </button>
    );
}
