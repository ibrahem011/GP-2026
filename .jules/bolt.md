## $(date +%Y-%m-%d) - Optimize Dashboard Property Counts
**Learning:** Using Supabase's `{ count: 'exact', head: true }` prevents fetching unnecessary full-row data when only counts are needed, resolving N+1 / large payload issues on analytics dashboards.
**Action:** Always prefer `head: true` counts over downloading all records and measuring array length on the client.
