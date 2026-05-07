## 2024-05-07 - Optimized existence checks

**Learning:** Using `.select('*').single()` for simple boolean existence checks in Supabase transfers the entire row data over the network and throws a `PGRST116` error if zero rows match.
**Action:** Use `.select('*', { count: 'exact', head: true })` and evaluate `(count ?? 0) > 0` to perform a lightweight HEAD request that avoids unnecessary data transfer and gracefully handles empty results.
