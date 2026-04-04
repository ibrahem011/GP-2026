#!/bin/bash
cat << 'PATCH_EOF' > /tmp/tests.patch
--- src/services/__tests__/supabaseService.test.ts
+++ src/services/__tests__/supabaseService.test.ts
@@ -213,6 +213,12 @@
     });

     describe('getFavorites', () => {
+        afterEach(() => {
+            // Try to clear caches
+            try {
+                supabaseService.clearFavoritesCache?.();
+            } catch (e) {}
+        });
+
         it('returns data and no error on success', async () => {
             mockRpc.mockResolvedValueOnce({
                 data: [
PATCH_EOF
patch -p0 < /tmp/tests.patch
