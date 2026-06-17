## 2024-05-08 - Supabase Existence Check Optimization
**Learning:** PostgREST PGRST116 errors occur when using `.single()` if no rows are found. It's safer and faster to use `{ count: 'exact', head: true }` for checking existence because it doesn't transfer row data.
**Action:** Use `.select('*', { count: 'exact', head: true })` instead of `.select('*').single()` for existence checks across the application.
