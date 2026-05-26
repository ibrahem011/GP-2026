"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { supabaseService } from "@/services/supabaseService";

type FavoritesLoadState = "idle" | "loading" | "loaded" | "error";

interface FavoritesContextType {
    favoriteIds: Set<string>;
    loadState: FavoritesLoadState;
    error: unknown;
    isFavorite: (propertyId: string) => boolean;
    ensureLoaded: () => Promise<void>;
    refreshFavorites: () => Promise<void>;
    toggleFavorite: (propertyId: string, nextState?: boolean) => Promise<boolean>;
}

const guestFavoritesContext: FavoritesContextType = {
    favoriteIds: new Set<string>(),
    loadState: "loaded",
    error: null,
    isFavorite: () => false,
    ensureLoaded: async () => {},
    refreshFavorites: async () => {},
    toggleFavorite: async (_propertyId, nextState) => Boolean(nextState),
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const [favoriteIds, setFavoriteIdsState] = useState<Set<string>>(() => new Set());
    const [loadState, setLoadState] = useState<FavoritesLoadState>("idle");
    const [error, setError] = useState<unknown>(null);
    const favoriteIdsRef = useRef(favoriteIds);
    const userIdRef = useRef<string | null>(userId);
    const loadedUserIdRef = useRef<string | null>(null);
    const loadPromiseRef = useRef<Promise<void> | null>(null);

    const setFavoriteIds = useCallback((nextIds: Set<string>) => {
        favoriteIdsRef.current = nextIds;
        setFavoriteIdsState(nextIds);
    }, []);

    useEffect(() => {
        userIdRef.current = userId;
        loadedUserIdRef.current = null;
        loadPromiseRef.current = null;
        setError(null);
        setLoadState(userId ? "idle" : "loaded");
        setFavoriteIds(new Set());
    }, [setFavoriteIds, userId]);

    const loadFavorites = useCallback(async (force = false) => {
        const activeUserId = userIdRef.current;

        if (!activeUserId) {
            setFavoriteIds(new Set());
            setError(null);
            setLoadState("loaded");
            return;
        }

        if (!force && loadedUserIdRef.current === activeUserId) {
            return;
        }

        if (!force && loadPromiseRef.current) {
            return loadPromiseRef.current;
        }

        const promise = (async () => {
            setLoadState("loading");
            setError(null);

            const { data, error: fetchError, isTimeout } = await supabaseService.getFavorites(activeUserId, {
                timeoutMs: 8_000,
                maxRetries: 0,
                retryOnTimeout: false,
                operationKey: "favoritesContext",
            });

            if (userIdRef.current !== activeUserId) {
                return;
            }

            if (fetchError || isTimeout) {
                setError(fetchError);
                setLoadState("error");
                return;
            }

            setFavoriteIds(new Set((data ?? []).map((favorite) => favorite.id)));
            loadedUserIdRef.current = activeUserId;
            setLoadState("loaded");
        })().finally(() => {
            if (loadPromiseRef.current === promise) {
                loadPromiseRef.current = null;
            }
        });

        loadPromiseRef.current = promise;
        return promise;
    }, [setFavoriteIds]);

    const ensureLoaded = useCallback(() => loadFavorites(false), [loadFavorites]);

    const refreshFavorites = useCallback(async () => {
        loadedUserIdRef.current = null;
        await loadFavorites(true);
    }, [loadFavorites]);

    const isFavorite = useCallback(
        (propertyId: string) => favoriteIds.has(propertyId),
        [favoriteIds],
    );

    const toggleFavorite = useCallback(async (propertyId: string, nextState?: boolean) => {
        const activeUserId = userIdRef.current;

        if (!activeUserId) {
            throw new Error("AUTH_REQUIRED");
        }

        const previousIds = favoriteIdsRef.current;
        const optimisticState = typeof nextState === "boolean" ? nextState : !previousIds.has(propertyId);
        const optimisticIds = new Set(previousIds);

        if (optimisticState) {
            optimisticIds.add(propertyId);
        } else {
            optimisticIds.delete(propertyId);
        }

        setFavoriteIds(optimisticIds);

        try {
            const actualState = await supabaseService.toggleFavorite(activeUserId, propertyId);
            const finalIds = new Set(favoriteIdsRef.current);

            if (actualState) {
                finalIds.add(propertyId);
            } else {
                finalIds.delete(propertyId);
            }

            setFavoriteIds(finalIds);
            return actualState;
        } catch (toggleError) {
            setFavoriteIds(previousIds);
            throw toggleError;
        }
    }, [setFavoriteIds]);

    const value = useMemo<FavoritesContextType>(
        () => ({
            favoriteIds,
            loadState,
            error,
            isFavorite,
            ensureLoaded,
            refreshFavorites,
            toggleFavorite,
        }),
        [
            ensureLoaded,
            error,
            favoriteIds,
            isFavorite,
            loadState,
            refreshFavorites,
            toggleFavorite,
        ],
    );

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
    return useContext(FavoritesContext) ?? guestFavoritesContext;
}
