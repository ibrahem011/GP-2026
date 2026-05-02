
## 2024-05-02 - Optimize Supabase existence checks
**Learning:** Using `.select('*').single()` for existence checks (like `isFavorite` or `isPropertyUnlocked`) fetches the full row and throws a `PGRST116` error if no rows are found, which forces error handling or `maybeSingle()`.
**Action:** Always use `.select('id', { count: 'exact', head: true })` for boolean existence checks to perform an HTTP HEAD request instead of fetching row data.
