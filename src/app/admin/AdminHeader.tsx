'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAdminRouteConfig } from './config';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Helper interface for search results
interface SearchGroup {
    type: 'properties' | 'users' | 'bookings' | 'payments';
    label: string;
    items: any[];
}

export default function AdminHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const config = getAdminRouteConfig(pathname);
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchGroup[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => setMounted(true), []);

    // Outside click to close search
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchRef]);

    // Simple debounce for unified search logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 1) {
                performSearch(searchQuery);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const performSearch = async (query: string) => {
        setIsSearching(true);
        setShowResults(true);
        
        try {
            // Simplified multi-table search (ideally via an RPC or specialized service)
            const [properties, users] = await Promise.all([
                supabase.from('properties').select('id, title, status').ilike('title', `%${query}%`).limit(3),
                supabase.from('profiles').select('id, full_name, role').ilike('full_name', `%${query}%`).limit(3)
            ]);

            const newResults: SearchGroup[] = [];
            
            if (properties.data && properties.data.length > 0) {
                newResults.push({ type: 'properties', label: 'العقارات', items: properties.data });
            }
            if (users.data && users.data.length > 0) {
                newResults.push({ type: 'users', label: 'المستخدمين', items: users.data });
            }
            // Additional booking/payment searches can be added here or routed globally

            setSearchResults(newResults);
        } catch (error) {
            console.error('Search error', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleResultClick = (type: string, id: string) => {
        setShowResults(false);
        setIsMobileSearchOpen(false);
        setSearchQuery('');
        // Navigate with hydration parameters
        router.push(`/admin/${type}?q=${id}`);
    };

    return (
        <header className="sticky top-0 z-30 bg-surface-light/80 dark:bg-surface-darkDim/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 py-3 px-4 lg:px-6 flex items-center justify-between transition-colors">
            
            {/* Context Mobile or search trigger */}
            <div className="flex items-center gap-3 lg:w-1/3">
                {/* Mobile Title */}
                <div className="lg:hidden flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-soft">
                        <span className="material-symbols-rounded text-white">admin_panel_settings</span>
                    </div>
                </div>

                {/* Desktop Title & Subtitle */}
                <div className="hidden lg:block">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">{config.title}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{config.subtitle}</p>
                </div>
            </div>

            {/* Middle: Unified Search (Desktop) */}
            <div className="hidden lg:flex flex-1 max-w-lg justify-center relative" ref={searchRef}>
                <div className="relative w-full group">
                    <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                    <input 
                        type="text" 
                        placeholder="ابحث عن عقار، مستخدم، أو رقم حجز..." 
                        className="w-full bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-none rounded-2xl py-3 pr-12 pl-4 focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.length > 1 && setShowResults(true)}
                    />
                    {isSearching && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                {/* Dropdown Results */}
                {showResults && (
                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-glow border border-slate-100 dark:border-white/10 overflow-hidden z-50">
                        {searchResults.length > 0 ? (
                            <div className="max-h-[70vh] overflow-y-auto p-2">
                                {searchResults.map((group) => (
                                    <div key={group.type} className="mb-2">
                                        <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            {group.label}
                                        </div>
                                        {group.items.map((item) => (
                                            <button 
                                                key={item.id}
                                                onClick={() => handleResultClick(group.type, item.id)}
                                                className="w-full text-right px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors flex items-center justify-between"
                                            >
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                                    {item.title || item.full_name || 'بدون اسم'}
                                                </span>
                                                <span className="material-symbols-rounded w-8 text-slate-400 text-lg">chevron_left</span>
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                {isSearching ? 'جاري البحث...' : 'لا توجد نتائج مطابقة.'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right Side: Actions & Profile */}
            <div className="flex items-center justify-end gap-2 lg:gap-4 lg:w-1/3">
                {/* Mobile Search Toggle */}
                <button 
                    className="w-10 h-10 flex lg:hidden items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                >
                    <span className="material-symbols-rounded text-[22px]">search</span>
                </button>

                {/* Dark Mode Toggle */}
                {mounted && (
                    <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-rounded text-[22px]">
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                )}

                <button className="w-10 h-10 hidden lg:flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative">
                    <span className="material-symbols-rounded text-[22px]">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                </button>
                <div className="hidden sm:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 mx-1"></div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">الإدارة</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm relative">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Admin Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-rounded">shield_person</span>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                    </div>
                </div>
            </div>

            {/* Mobile Expandable Search Bar */}
            {isMobileSearchOpen && (
                <div className="absolute top-full left-0 right-0 bg-surface-light dark:bg-surface-darkDim p-4 border-b border-slate-200 dark:border-white/10 shadow-soft lg:hidden">
                    <div className="relative w-full group">
                        <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                        <input 
                            type="text" 
                            placeholder="ابحث هنا..." 
                            className="w-full bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-none rounded-2xl py-3 pr-12 pl-4 focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {showResults && (
                        <div className="mt-2 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-glow border border-slate-100 dark:border-white/10 overflow-hidden z-50">
                            {searchResults.length > 0 ? (
                                <div className="max-h-[50vh] overflow-y-auto p-2">
                                    {searchResults.map((group) => (
                                        <div key={group.type} className="mb-2">
                                            <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {group.label}
                                            </div>
                                            {group.items.map((item) => (
                                                <button 
                                                    key={item.id}
                                                    onClick={() => handleResultClick(group.type, item.id)}
                                                    className="w-full text-right px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors flex items-center justify-between"
                                                >
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                                        {item.title || item.full_name || 'بدون اسم'}
                                                    </span>
                                                    <span className="material-symbols-rounded text-slate-400 text-lg">chevron_left</span>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-slate-500 text-sm">
                                    {isSearching ? 'جاري البحث...' : 'لا توجد نتائج.'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
