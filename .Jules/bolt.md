## $(date +%Y-%m-%d) - Optimize Supabase existence checks to use HTTP HEAD
**Learning:** Checking for row existence using `.select('*').single()` triggers a full database fetch and network transfer for the row data, and can throw PostgREST `PGRST116` errors if no row is found.
**Action:** Always use `.select('id', { count: 'exact', head: true })` and evaluate `(count ?? 0) > 0` for boolean existence checks to issue efficient, data-less HTTP HEAD requests.
