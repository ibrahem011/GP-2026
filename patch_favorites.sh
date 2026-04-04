#!/bin/bash
cat << 'PATCH_EOF' > /tmp/favorites.patch
--- src/services/supabaseService.ts
+++ src/services/supabaseService.ts
@@ -500,6 +500,11 @@
 // Store a set of favorited property IDs when in mock mode
 const _mockFavorites = new Set<string>();

+// Caches for getFavorites to prevent N+1 frontend query bottlenecks
+// ⚡ Bolt: Implements in-flight promise deduplication and short-lived caching
+const _favoritesPromises = new Map<string, Promise<{ data: PropertyRow[]; error: any }>>();
+const _favoritesCache = new Map<string, { data: PropertyRow[], timestamp: number }>();
+const FAVORITES_CACHE_TTL_MS = 10000;
+
 export const supabaseService = {
     // ====== المصادقة ======
@@ -858,34 +863,48 @@
     },

-    // ====== المفضلة ======
+    // ====== ط§ظ„ظ…ظپط¶ظ„ط© ======
     async getFavorites(userId: string): Promise<{ data: PropertyRow[]; error: any }> {
         if (shouldShortCircuitMock()) {
             const favoriteProperties = Array.from(_mockFavorites)
                 .map((id) => MOCK_PROPERTIES.find((property) => property.id === id) || null)
                 .filter((property): property is PropertyRow => property !== null);

             return { data: favoriteProperties, error: null };
         }

-        try {
-            const { data, error } = await supabase
-                .rpc('get_user_favorites', { uid: userId });
+        // ⚡ Bolt: Check short-lived cache
+        const now = Date.now();
+        const cached = _favoritesCache.get(userId);
+        if (cached && (now - cached.timestamp < FAVORITES_CACHE_TTL_MS)) {
+            return { data: cached.data, error: null };
+        }

-            if (error) {
-                if (isMissingRpcFunctionError(error, 'get_user_favorites')) {
-                    return await getFavoritesFallback(userId);
-                }
+        // ⚡ Bolt: Deduplicate in-flight requests
+        if (_favoritesPromises.has(userId)) {
+            return _favoritesPromises.get(userId)!;
+        }

-                console.error('[getFavorites RPC Error]', error);
-                return { data: [], error };
-            }
+        const promise = (async () => {
+            try {
+                const { data, error } = await supabase
+                    .rpc('get_user_favorites', { uid: userId });

-            return { data: (data || []) as PropertyRow[], error: null };
-        } catch (error) {
-            if (isMissingRpcFunctionError(error, 'get_user_favorites')) {
-                return await getFavoritesFallback(userId);
-            }
+                if (error) {
+                    if (isMissingRpcFunctionError(error, 'get_user_favorites')) {
+                        const fallbackResult = await getFavoritesFallback(userId);
+                        if (!fallbackResult.error && fallbackResult.data) {
+                            _favoritesCache.set(userId, { data: fallbackResult.data, timestamp: Date.now() });
+                        }
+                        return fallbackResult;
+                    }

-            console.error('[getFavorites Unexpected Error]', error);
-            return { data: [], error };
-        }
+                    console.error('[getFavorites RPC Error]', error);
+                    return { data: [], error };
+                }
+
+                const resultData = (data || []) as PropertyRow[];
+                _favoritesCache.set(userId, { data: resultData, timestamp: Date.now() });
+                return { data: resultData, error: null };
+            } catch (error) {
+                if (isMissingRpcFunctionError(error, 'get_user_favorites')) {
+                    const fallbackResult = await getFavoritesFallback(userId);
+                    if (!fallbackResult.error && fallbackResult.data) {
+                        _favoritesCache.set(userId, { data: fallbackResult.data, timestamp: Date.now() });
+                    }
+                    return fallbackResult;
+                }
+
+                console.error('[getFavorites Unexpected Error]', error);
+                return { data: [], error };
+            } finally {
+                _favoritesPromises.delete(userId);
+            }
+        })();
+
+        _favoritesPromises.set(userId, promise);
+        return promise;
     },

     async toggleFavorite(userId: string, propertyId: string): Promise<boolean> {
+        // ⚡ Bolt: Invalidate cache on mutation
+        _favoritesCache.delete(userId);
+
         if (shouldShortCircuitMock()) {
             if (_mockFavorites.has(propertyId)) {
PATCH_EOF
patch --no-backup-if-mismatch -p0 < /tmp/favorites.patch
