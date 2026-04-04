#!/bin/bash
cat << 'PATCH_EOF' > /tmp/tests.patch
--- src/services/__tests__/supabaseService.test.ts
+++ src/services/__tests__/supabaseService.test.ts
@@ -214,6 +214,9 @@

     describe('getFavorites', () => {
         beforeEach(() => {
+            // Clear caches between tests to avoid test pollution
+            (supabaseService as any)._favoritesCache?.clear?.();
+            (supabaseService as any)._favoritesPromises?.clear?.();
             supabaseMock.rpc.mockReset();
             supabaseMock.from.mockReset();
         });
PATCH_EOF
patch -p0 < /tmp/tests.patch
