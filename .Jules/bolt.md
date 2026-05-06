## $(date +%Y-%m-%d) - Optimize Supabase Existence Checks with HTTP HEAD
**Learning:** Using `.select('*').single()` just to check if a row exists in Supabase is inefficient, as it fetches row data and PostgREST throws (and the client catches) `PGRST116` errors if no rows are found.
**Action:** Replace existence checks using `.single()` with `.select('*', { count: 'exact', head: true })` and check `(count ?? 0) > 0`. This performs an HTTP HEAD request, drastically reducing payload size and eliminating background error throwing for clean boolean existence checks.
