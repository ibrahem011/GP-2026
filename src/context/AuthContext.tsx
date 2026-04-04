'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole } from '@/types';
import { getCurrentUser, setCurrentUser as saveUser } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { normalizeRole } from '@/lib/roles';

import { getIsMockMode } from '@/config/constants';

type OAuthProvider = 'google' | 'facebook' | 'apple';

interface OAuthSignInResult {
    success: boolean;
    error?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: { name: string; email: string; phone: string; password: string; role?: UserRole }) => Promise<boolean>;
    signInWithProvider: (provider: OAuthProvider, redirectPath?: string) => Promise<OAuthSignInResult>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const isMountedRef = useRef(false);

    const sanitizeRedirectPath = useCallback((path?: string) => {
        if (!path || !path.startsWith('/') || path.startsWith('//')) {
            return '/';
        }
        if (path.startsWith('/auth')) {
            return '/';
        }
        return path;
    }, []);

    const buildOAuthRedirectTo = useCallback((redirectPath?: string) => {
        const safeRedirect = sanitizeRedirectPath(redirectPath);
        const callbackUrl = new URL('/auth', window.location.origin);
        callbackUrl.searchParams.set('mode', 'login');
        callbackUrl.searchParams.set('redirect', safeRedirect);
        return callbackUrl.toString();
    }, [sanitizeRedirectPath]);

    const getCanonicalRole = useCallback(async (u: any): Promise<UserRole> => {
        const metadataRole = normalizeRole(u.user_metadata?.role as string | undefined);

        if (getIsMockMode()) {
            return metadataRole;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', u.id)
            .maybeSingle();

        if (error) {
            console.warn('[AuthContext] Failed to resolve role from profiles, using metadata role', error);
            return metadataRole;
        }

        return normalizeRole((data as { role?: string } | null)?.role ?? metadataRole);
    }, []);

    const mapSupabaseUser = useCallback(async (u: any): Promise<User> => {
        const role = await getCanonicalRole(u);

        return {
            id: u.id,
            name: (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || u.email?.split('@')[0] || 'User',
            phone: (u.user_metadata?.phone as string) || '',
            email: u.email || '',
            avatar: (u.user_metadata?.avatar_url as string) || undefined,
            role,
            favorites: [],
            unlockedProperties: [],
            isVerified: false,
            createdAt: new Date().toISOString(),
            memberSince: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
        };
    }, [getCanonicalRole]);

    // Initial Load & Event Listeners
    useEffect(() => {
        isMountedRef.current = true;

        const loadUser = async () => {
            try {
                // Try from storage (Mock Mode fallback or primary)
                const currentUser = getCurrentUser();
                if (currentUser) {
                    const normalizedCurrentUser = {
                        ...currentUser,
                        role: normalizeRole(currentUser.role),
                    };
                    saveUser(normalizedCurrentUser);
                    if (isMountedRef.current) {
                        setUser(normalizedCurrentUser);
                    }
                } else {
                    // If no local user, check Supabase (if not mock)
                    if (!getIsMockMode()) {
                        const { data } = await supabase.auth.getSession();
                        const sessionUser = data.session?.user;

                        if (sessionUser) {
                            const mapped = await mapSupabaseUser(sessionUser);
                            saveUser(mapped);
                            if (isMountedRef.current) {
                                setUser(mapped);
                            }
                        } else {
                            saveUser(null);
                            if (isMountedRef.current) {
                                setUser(null);
                            }
                        }
                    } else {
                        if (isMountedRef.current) {
                            setUser(null);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading user:', error);
                // Clear potentially corrupted data
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('gamasa_current_user');
                }
                if (isMountedRef.current) {
                    setUser(null);
                }
            } finally {
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        };

        loadUser();

        // Listen for updates from other components/tabs
        const handleUserUpdate = () => {
            const currentUser = getCurrentUser();
            const normalizedCurrentUser = currentUser
                ? { ...currentUser, role: normalizeRole(currentUser.role) }
                : null;
            if (isMountedRef.current) {
                setUser(normalizedCurrentUser);
            }
        };

        // 'userUpdated' is dispatch by storage.ts in the same tab
        window.addEventListener('userUpdated', handleUserUpdate);

        // 'storage' event fires when localStorage changes in OTHER tabs
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'gamasa_current_user' || e.key === null) {
                handleUserUpdate();
            }
        };
        window.addEventListener('storage', handleStorage);

        // Supabase auth state listener
        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const sessionUser = session?.user;
            if (sessionUser) {
                const mapped = await mapSupabaseUser(sessionUser);
                saveUser(mapped);
                if (isMountedRef.current) {
                    setUser(mapped);
                }
            } else {
                saveUser(null);
                if (isMountedRef.current) {
                    setUser(null);
                }
            }
        });

        return () => {
            isMountedRef.current = false;
            window.removeEventListener('userUpdated', handleUserUpdate);
            window.removeEventListener('storage', handleStorage);
            sub.subscription.unsubscribe();
        };
    }, [mapSupabaseUser]);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setLoading(true);

            if (getIsMockMode()) {
                // Mock Mode: Check localStorage 'gamasa_users'
                const users = JSON.parse(localStorage.getItem('gamasa_users') || '[]');
                const foundUser = users.find((u: any) => u.email === email && u.password === password);

                if (foundUser) {
                    const { password: _, ...userWithoutPassword } = foundUser;
                    const normalizedUser = {
                        ...userWithoutPassword,
                        role: normalizeRole(userWithoutPassword.role),
                    };
                    saveUser(normalizedUser);
                    setUser(normalizedUser);
                    return true;
                }
                return false;
            } else {
                // Supabase Logic
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error || !data.user) return false;

                const mapped = await mapSupabaseUser(data.user);
                saveUser(mapped);
                setUser(mapped);

                return true;
            }
        } catch (error) {
            console.error('Login error:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData: { name: string; email: string; phone: string; password: string; role?: UserRole }): Promise<boolean> => {
        try {
            setLoading(true);

            if (getIsMockMode()) {
                const users = JSON.parse(localStorage.getItem('gamasa_users') || '[]');

                if (users.some((u: any) => u.email === userData.email)) {
                    alert('البريد الإلكتروني مستخدم بالفعل');
                    return false;
                }

                const newUser = {
                    id: Math.random().toString(36).substring(2) + Date.now().toString(36),
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    role: normalizeRole(userData.role),
                    password: userData.password,
                    favorites: [],
                    unlockedProperties: [],
                    isVerified: false,
                    createdAt: new Date().toISOString(),
                    memberSince: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                };

                users.push(newUser);
                localStorage.setItem('gamasa_users', JSON.stringify(users));

                const { password: _, ...userWithoutPassword } = newUser;
                const normalizedUser = {
                    ...userWithoutPassword,
                    role: normalizeRole(userWithoutPassword.role),
                };
                saveUser(normalizedUser);
                setUser(normalizedUser);
                return true;
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email: userData.email,
                    password: userData.password,
                    options: {
                        data: {
                            name: userData.name,
                            phone: userData.phone,
                            role: normalizeRole(userData.role),
                        }
                    }
                });

                if (error) {
                    const errorCode = (error as any)?.code as string | undefined;
                    const errorMessage = error.message || '';
                    const isAlreadyRegistered =
                        errorCode === 'user_already_exists' ||
                        /user already registered/i.test(errorMessage);

                    if (isAlreadyRegistered) {
                        alert('هذا البريد الإلكتروني مسجل بالفعل. استخدم تسجيل الدخول أو استعادة كلمة المرور.');
                        return false;
                    }

                    if (/database error saving new user/i.test(errorMessage)) {
                        alert('تعذر إنشاء الحساب بسبب خطأ بقاعدة البيانات. أعد المحاولة الآن، وإذا تكرر الخطأ استخدم بريدًا آخر مؤقتًا.');
                        return false;
                    }

                    console.error('Supabase signup error:', error);
                    alert(errorMessage || 'فشل إنشاء الحساب، حاول مرة أخرى.');
                    return false;
                }

                if (data.user) {
                    const newUser = await mapSupabaseUser(data.user);
                    saveUser(newUser);
                    setUser(newUser);
                    return true;
                }

                return false;
            }
        } catch (error) {
            console.error('Register error:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signInWithProvider = async (
        provider: OAuthProvider,
        redirectPath?: string
    ): Promise<OAuthSignInResult> => {
        try {
            if (getIsMockMode()) {
                return {
                    success: false,
                    error: 'OAuth غير متاح في وضع المحاكاة.',
                };
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: buildOAuthRedirectTo(redirectPath),
                },
            });

            if (error) {
                return {
                    success: false,
                    error: error.message || 'تعذر بدء تسجيل الدخول الاجتماعي.',
                };
            }

            return { success: true };
        } catch (error) {
            console.error('OAuth sign-in error:', error);
            return {
                success: false,
                error: 'حدث خطأ أثناء بدء تسجيل الدخول الاجتماعي.',
            };
        }
    };

    const logout = async () => {
        saveUser(null);
        setUser(null);
        if (!getIsMockMode()) {
            await supabase.auth.signOut();
        }
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                signInWithProvider,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
