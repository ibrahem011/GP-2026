## 2024-03-30 - [Frontend] Cache user favorites state

**Learning:** When rendering lists of properties (like in the search page, home page, or my-properties), `PropertyCard` fetches the user's favorites individually via `supabaseService.getFavorites(user.id)`. If there are 20 properties rendered, it fires 20 identical DB queries for the same user's favorites list.

**Action:** Implement an in-memory short-lived cache (deduplication/memoization) for `getFavorites` within the `propertyService.ts` to solve this N+1 query issue without requiring refactoring `PropertyCard` or managing global React state.
