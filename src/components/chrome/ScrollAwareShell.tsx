'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function ScrollAwareShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [hidden, setHidden] = useState(false);
    const prevScrollY = useRef(0);
    const scrollTimeout = useRef<number | null>(null);
    const hideFavoritesChrome = pathname === '/favorites' && !isDesktop;

    useEffect(() => {
        const handleScroll = () => {
            if (scrollTimeout.current) return;

            scrollTimeout.current = requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const delta = currentScrollY - prevScrollY.current;

                if (currentScrollY < 10) {
                    setHidden(false);
                } else if (delta > 12) {
                    setHidden(true); // scrolling down
                } else if (delta < -12) {
                    setHidden(false); // scrolling up
                }

                prevScrollY.current = currentScrollY;
                scrollTimeout.current = null;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeout.current) cancelAnimationFrame(scrollTimeout.current);
        };
    }, []);

    return (
        <>
            {!hideFavoritesChrome ? (
                <div
                    className={`fixed top-0 inset-x-0 z-[100] transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'
                        }`}
                >
                    <Header />
                </div>
            ) : null}

            <main className={hideFavoritesChrome ? 'min-h-screen' : 'min-h-screen pb-[var(--chrome-bottom)] md:pb-0'}>
                {children}
            </main>

            {!hideFavoritesChrome ? (
                <div
                    className={`fixed bottom-0 inset-x-0 z-[100] transition-transform duration-300 md:hidden pointer-events-none ${hidden ? 'translate-y-24' : 'translate-y-0'
                        }`}
                >
                    <BottomNav />
                </div>
            ) : null}
        </>
    );
}
