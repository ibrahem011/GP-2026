## 2024-05-06 - Optimizing existence checks in Supabase
**Learning:** Using `.select('*').single()` just to verify if a record exists is a performance bottleneck in this app. It pulls full row data over the network and throws `PGRST116` errors for zero rows.
**Action:** Always prefer `.select('*', { count: 'exact', head: true })` for boolean existence checks to execute a lightweight HTTP HEAD request and avoid row-level payloads. Using `*` over `id` is safer if the table doesn't have a specific `id` column.
