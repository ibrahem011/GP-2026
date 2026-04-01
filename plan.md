1. **Identify the Bottleneck**: `src/app/admin/page.tsx` fetches all properties (`supabaseService.getProperties()`) just to calculate the total property count and the pending property count, which is a classic N+1/Data transfer problem that slows down the page. It pulls potentially thousands of full `PropertyRow` objects from the database.

2. **Add `getPropertiesCount` to `propertyService.ts`**:
   - Similar to `getProfilesCount` and `getPaymentRequestsCount`, add a new method `getPropertiesCount(filters?: { status?: string })` to `src/services/supabase/propertyService.ts`.
   - Use `{ count: 'exact', head: true }` so Supabase only returns the count without transferring row data.

3. **Export the new method**:
   - Expose it from `createPropertyService` and re-export it from `src/services/supabase/index.ts`.

4. **Update `src/app/admin/page.tsx`**:
   - Replace the `supabaseService.getProperties()` and `supabaseService.getProperties({ status: 'pending' })` calls with the new `getPropertiesCount()` equivalents for calculating counts.
   - For `recentProperties`, keep a targeted `getProperties({ status: 'pending', limit: 5 })` call (adding `limit: 5` to only fetch what's needed).

5. **Update `.jules/bolt.md`**:
   - Document the learning about using `{ count: 'exact', head: true }` instead of fetching full rows.

6. **Pre-commit Checks**:
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

7. **Submit the PR**:
   - Title: `⚡ Bolt: Optimize admin dashboard property counts`
