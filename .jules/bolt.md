## 2024-05-18 - Optimize Supabase existence checks to use HEAD requests
**Learning:** Using `.select(*).single()` for existence checks fetches the entire row payload from the database and transfers it over the network, which is unnecessary and inefficient.
**Action:** When only checking for the existence of a record, use `.select('id', { count: 'exact', head: true })` and return `(count ?? 0) > 0`. This performs an HTTP HEAD request and avoids transferring unnecessary row data.
