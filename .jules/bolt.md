## 2026-04-22 - [Optimize Supabase Existence Checks]
**Learning:** Using `.select('*').single()` for existence checks in Supabase is inefficient because it transfers the entire row payload and triggers PostgREST error logic (PGRST116) if no rows are found, which is silently swallowed by the `data` check but still consumes processing time.
**Action:** Always use `.select('id', { count: 'exact', head: true })` for boolean existence checks to issue an HTTP HEAD request instead of fetching row data, and verify existence using `if ((count ?? 0) > 0)`.
