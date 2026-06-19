
## 2025-04-27 - Supabase Existence Checks
**Learning:** Checking existence via `.select('*').single()` downloads the full row payload, and implicitly relies on null `data` for failure handling.
**Action:** Always prefer `.select('id', { count: 'exact', head: true })` for simple boolean existence queries to prevent unnecessary data transfer and rely on explicit counts.
