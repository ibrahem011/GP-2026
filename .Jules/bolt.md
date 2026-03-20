
## 2024-05-18 - [Replace full queries with count queries on Profile page]
**Learning:** In Supabase, retrieving entire rows of data merely to calculate array length on the client side leads to high unnecessary payload size and memory overhead. This pattern (N+1 arrays or bulk list-fetching when only the count is needed) is a significant performance anti-pattern.
**Action:** Always favor `.select('*', { count: 'exact', head: true })` and distinct count-only RPC functions or service methods (e.g., `getPropertiesCount`) instead of fetching lists to call `.length`.
