
## 2025-02-18 - Optimized existence checks using HEAD requests
**Learning:** Checking for row existence in Supabase using `.select('*').single()` fetches the full row's data and can trigger PGRST116 (0 rows) errors.
**Action:** Replace `.single()` existence queries with `.select('id', { count: 'exact', head: true })` to execute an HTTP HEAD request instead of fetching JSON payload, reducing network overhead.
