# Gamasa Properties — Data Sync Architecture Refactoring

Unify the mock-mode flag, eliminate duplicate Supabase calls scattered across [storage.ts](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts), and ensure every data operation flows through [supabaseService.ts](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/services/supabaseService.ts) as the single source of truth.

---

## Proposed Changes

### Component 1 — Global Mock Mode Constant

#### [NEW] [constants.ts](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/config/constants.ts)

Create the single source of truth for mock mode. Priority: `localStorage DEV_MOCK_MODE` → env var `NEXT_PUBLIC_IS_MOCK_MODE`.

```ts
/**
 * Global mock-mode flag.
 * Priority: localStorage "DEV_MOCK_MODE" → env var NEXT_PUBLIC_IS_MOCK_MODE.
 */
export const IS_MOCK_MODE =
    typeof window !== 'undefined'
        ? window.localStorage.getItem('DEV_MOCK_MODE') === 'true'
        : process.env.NEXT_PUBLIC_IS_MOCK_MODE === 'true';
```

---

#### [MODIFY] [supabaseService.ts](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/services/supabaseService.ts)

Delete the internal `IS_MOCK_MODE` declaration and import it from `constants.ts`, then re-export it so other files that already import it from here keep working.

```diff
+import { IS_MOCK_MODE } from '@/config/constants';
+export { IS_MOCK_MODE };

-// === Mock Mode Flag ===
-export const IS_MOCK_MODE =
-    typeof window !== 'undefined'
-        ? window.localStorage.getItem('DEV_MOCK_MODE') === 'true'
-        : process.env.NEXT_PUBLIC_IS_MOCK_MODE === 'true';
```

Lines affected: **7 – 11**

---

#### [MODIFY] [AuthContext.tsx](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/context/AuthContext.tsx)

Replace the local `IS_MOCK_MODE` with the centralized import.

```diff
+import { IS_MOCK_MODE } from '@/config/constants';

-// Mock Mode Flag
-const IS_MOCK_MODE = process.env.NEXT_PUBLIC_IS_MOCK_MODE === 'true';
```

Lines affected: **9 – 10**

---

### Component 2 — useMyProperties Hook Rewrite

#### [MODIFY] [useMyProperties.ts](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/hooks/useMyProperties.ts)

Complete rewrite of imports and logic:

1. **Remove all [storage.ts](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts) imports** — replace with `supabaseService` + `IS_MOCK_MODE`.
2. **Add 10-second timeout** via `Promise.race`.
3. **Error handling** — clear user message in production; fallback to local mock data on timeout/error in mock mode.

```diff
-import {
-    getProperties,
-    getUserPropertiesFromSupabase,
-    deletePropertyFromSupabase,
-    updatePropertyInSupabase,
-} from '@/lib/storage';
+import { IS_MOCK_MODE, supabaseService } from '@/services/supabaseService';
+import { fromPropertyRow } from '@/lib/propertyMapper';
```

Lines affected: **3 – 8**

Remove `isMockMode` local variable (line 34):
```diff
-    const isMockMode = process.env.NEXT_PUBLIC_IS_MOCK_MODE === 'true';
```

Rewrite `loadProperties` (lines 36–66) with 10-second timeout:
```ts
const loadProperties = useCallback(async () => {
    if (!userId) {
        setLoading(false);
        return;
    }

    setLoading(true);
    setError(null);

    const TIMEOUT_MS = 10_000;

    try {
        const fetchPromise = supabaseService.getProperties({ ownerId: userId });
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
        );

        const rows = await Promise.race([fetchPromise, timeoutPromise]);
        setProperties(rows.map(fromPropertyRow));
    } catch (err: any) {
        console.error('Error loading properties:', err);

        if (IS_MOCK_MODE) {
            // Fallback: show in-memory mock data
            const mockRows = await supabaseService.getProperties({ ownerId: userId });
            setProperties(mockRows.map(fromPropertyRow));
        } else {
            const msg = err?.message === 'TIMEOUT'
                ? 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.'
                : 'فشل تحميل العقارات. يرجى المحاولة لاحقاً.';
            setError(msg);
            setProperties([]);
        }
    } finally {
        setLoading(false);
    }
}, [userId]);
```

Rewrite [deleteProperty](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/services/supabaseService.ts#795-817) (lines 68–93):
```ts
const deleteProperty = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
        const success = await supabaseService.deleteProperty(id);
        if (success) {
            setProperties((prev) => prev.filter((p) => p.id !== id));
            callbacks?.onSuccess?.('تم حذف العقار بنجاح');
        } else {
            callbacks?.onError?.('فشل حذف العقار، يرجى المحاولة مرة أخرى');
        }
    } catch (err) {
        console.error('Error deleting property:', err);
        callbacks?.onError?.('فشل حذف العقار. يرجى المحاولة مرة أخرى.');
    } finally {
        setDeletingId(null);
    }
}, [callbacks]);
```

Rewrite `updateStatus` (lines 95–119):
```ts
const updateStatus = useCallback(async (id: string, newStatus: PropertyStatus) => {
    try {
        const updated = await supabaseService.updateProperty(id, { status: newStatus });
        if (updated) {
            setProperties((prev) => prev.map((p) => p.id === id ? fromPropertyRow(updated) : p));
            callbacks?.onSuccess?.('تم تحديث حالة العقار بنجاح');
        } else {
            callbacks?.onError?.('فشل تحديث حالة العقار');
        }
    } catch (err) {
        console.error('Error updating status:', err);
        callbacks?.onError?.('فشل تحديث حالة العقار');
    }
}, [callbacks]);
```

Remove `isMockMode` from `useCallback` dependency arrays.

---

### Component 3 — Storage Cleanup

#### [MODIFY] [storage.ts](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts)

**3a. Delete duplicate DB functions** (lines 140–274):

Remove these exported functions entirely:
- [getPropertiesFromSupabase](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#140-156) (lines 141–155)
- [getUserPropertiesFromSupabase](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#157-202) (lines 158–201)
- [getPropertyByIdFromSupabase](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#203-220) (lines 204–219)
- [deletePropertyFromSupabase](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#221-248) (lines 221–247)
- [updatePropertyInSupabase](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#249-275) (lines 249–274)

**3b. Make [addNotification](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#539-551) dual-mode** (lines 539–549):

```diff
+import { IS_MOCK_MODE } from '@/config/constants';
+import { supabaseService } from '@/services/supabaseService';

-export function addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
+export async function addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> {
+    if (!IS_MOCK_MODE && notification.userId) {
+        try {
+            await supabaseService.createNotification({
+                userId: notification.userId,
+                title: notification.title,
+                message: notification.message,
+                type: notification.type as 'success' | 'info' | 'warning' | 'error',
+                link: notification.link,
+            });
+        } catch (err) {
+            console.error('Failed to create Supabase notification, falling back to localStorage:', err);
+        }
+    }
+
     const notifications = getNotifications();
     const newNotification: Notification = {
         ...notification,
         id: generateId(),
         isRead: false,
         createdAt: new Date().toISOString(),
     };
     notifications.unshift(newNotification);
     setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
     return newNotification;
 }
```

**3c. Make [toggleFavorite](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#427-440) dual-mode** (lines 427–439):

```diff
-export function toggleFavorite(propertyId: string): boolean {
+export async function toggleFavorite(propertyId: string): Promise<boolean> {
     const user = getCurrentUser();
     if (!user) return false;

+    if (!IS_MOCK_MODE) {
+        return supabaseService.toggleFavorite(user.id, propertyId);
+    }
+
     const index = user.favorites.indexOf(propertyId);
     if (index === -1) {
         user.favorites.push(propertyId);
     } else {
         user.favorites.splice(index, 1);
     }
     setCurrentUser(user);
     return index === -1;
 }
```

**3d. Make [unlockProperty](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/services/supabaseService.ts#1037-1078) dual-mode** (lines 446–465):

```diff
-export function unlockProperty(propertyId: string): boolean {
+export async function unlockProperty(propertyId: string, paymentId?: string): Promise<boolean> {
     const user = getCurrentUser();
     if (!user) return false;

+    if (!IS_MOCK_MODE) {
+        await supabaseService.unlockProperty(user.id, propertyId, paymentId);
+        return true;
+    }
+
     if (!user.unlockedProperties.includes(propertyId)) {
         user.unlockedProperties.push(propertyId);
         setCurrentUser(user);

-        addNotification({
+        await addNotification({
             userId: user.id,
             title: 'تم فك القفل بنجاح',
             message: 'يمكنك الآن التواصل مع المالك مباشرة.',
             type: 'success',
             link: `/property/${propertyId}`
         });
         return true;
     }
     return true;
 }
```

---

### Component 4 — Add Property Page

#### [MODIFY] [page.tsx](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/app/add-property/page.tsx)

**4a. Update imports** (line 11):

```diff
-import { addNotification, addProperty, deletePropertyImages, getCurrentUser, uploadPropertyImages } from '@/lib/storage';
+import { addNotification, getCurrentUser } from '@/lib/storage';
+import { supabaseService } from '@/services/supabaseService';
```

**4b. Rewrite [handleSubmit](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/app/add-property/page.tsx#365-437)** (lines 365–436):

Replace the entire [handleSubmit](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/app/add-property/page.tsx#365-437) body:

```ts
const handleSubmit = async () => {
    setLoading(true);
    setValidationErrors([]);

    try {
        if (!actualUser) {
            showToast('يجب تسجيل الدخول أولاً.', 'error');
            return;
        }

        if (stagedImages.length === 0) {
            showToast('يرجى إضافة صورة واحدة على الأقل.', 'error');
            return;
        }

        setUploading(true);

        const newProperty = await supabaseService.createFullProperty(
            {
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                price_unit: formData.priceUnit,
                category: formData.category,
                location_lat: selectedLocation?.lat,
                location_lng: selectedLocation?.lng,
                address: formData.address,
                area: formData.selectedArea,
                owner_phone: formData.ownerPhone,
                owner_name: formData.ownerName,
                features: formData.features,
                bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms,
                floor_area: Number(formData.area) || 0,
                floor_number: formData.floor,
            },
            stagedImages.map((img) => img.file),
            actualUser.id
        );

        await addNotification({
            userId: actualUser.id,
            title: 'تمت إضافة عقارك بنجاح!',
            message: `عقارك "${formData.title}" قيد المراجعة من الإدارة.`,
            type: 'success',
            link: `/property/${newProperty.id}`,
        });

        setSuccess(true);

        setTimeout(() => {
            window.location.href = '/my-properties';
        }, 2000);
    } catch (error) {
        console.error('Error adding property:', error);
        showToast('حدث خطأ أثناء إضافة العقار. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
        setUploading(false);
        setLoading(false);
    }
};
```

Key changes:
- Replaced [uploadPropertyImages()](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/services/supabaseService.ts#584-603) + [addProperty()](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#287-328) with single `supabaseService.createFullProperty()`.
- Added `await` before [addNotification](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#539-551).
- Removed the inner `try/catch` that manually deleted images on failure (now handled by [createFullProperty](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/services/supabaseService.ts#612-666)).

---

### Component 5 — Side Effect Files

#### [MODIFY] [Header.tsx](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/components/Header.tsx)

> [!NOTE]
> [Header.tsx](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/components/Header.tsx) currently uses localStorage-only notification functions. These will automatically benefit from the dual-mode [addNotification](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#539-551) change in [storage.ts](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts). The [getNotifications](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#531-538), [markNotificationAsRead](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/services/supabaseService.ts#1265-1272), [markAllNotificationsAsRead](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/services/supabaseService.ts#1273-1280) functions remain localStorage-based since the Header already reads Supabase notifications through `supabaseService.getNotifications`. No code change needed here at this stage — the notification read/write pipeline is separate and this file only reads from localStorage.

No changes needed for now.

---

#### [MODIFY] [UnlockModal.tsx](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/components/UnlockModal.tsx)

Line 42: [addNotification](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/lib/storage.ts#539-551) is now async, add `await`:

```diff
-            addNotification({
+            await addNotification({
```

Lines affected: **42**

---

#### [MODIFY] [route.ts](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/app/api/debug/route.ts)

Remove imports of deleted functions. This route should use `supabaseService` instead.

```diff
-import { getPropertiesFromSupabase, getUserPropertiesFromSupabase } from '@/lib/storage';
+import { supabaseService } from '@/services/supabaseService';
```

And replace any calls to the deleted functions with `supabaseService.getProperties()`.

---

## Verification Plan

### Automated Tests

Existing test suite uses **Vitest**. Run from project root:

```bash
npx vitest run
```

The existing test file [supabaseService.test.ts](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/services/__tests__/supabaseService.test.ts) tests [getUserBookings](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/services/supabaseService.ts#2067-2127) and [getFavorites](file:///c:/Users/CRIZMA%20MEGA%20STORE/Documents/GitHub/GP-2026/src/services/supabaseService.ts#818-851) with RPC fallback — these should continue to pass since `supabaseService` internals are unchanged.

### Build Verification

```bash
npm run build
```

This ensures no import errors, no TypeScript type mismatches, and all pages compile correctly after the refactoring.

### Manual Verification

> [!IMPORTANT]
> The following browser tests should be performed by the user after applying all changes.

1. **Mock Mode test**: Open browser console → `localStorage.setItem('DEV_MOCK_MODE', 'true')` → refresh → add a property → verify it appears instantly in "عقاراتي" page.
2. **Production Mode test**: `localStorage.setItem('DEV_MOCK_MODE', 'false')` → refresh → add a property → verify data arrives in Supabase Dashboard.
3. **Notification test**: After successful property addition, check the bell icon for the new notification without UI freezing.
4. **Timeout test**: In production mode, throttle network to "Slow 3G" in DevTools → go to "عقاراتي" → verify the 10-second timeout message appears instead of infinite loading.
