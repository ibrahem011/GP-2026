## 2026-04-24 - Optimize Supabase existence checks
**Learning:** Using `.select('*').single()` to verify if a record exists fetches unnecessary row data and is less performant. Instead, using `.select('id', { count: 'exact', head: true })` performs a lightweight HTTP HEAD request, returning only the record count without the data body, minimizing data transfer.
**Action:** When only checking for record existence (boolean outcome), prefer `.select('...', { count: 'exact', head: true })` over `.single()` or fetching row bodies.
