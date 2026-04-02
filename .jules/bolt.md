## 2024-05-18 - [Optimizing count queries using Supabase]
**Learning:** Fetching full result sets (`.select('*')` then `.length`) just to get a count is an anti-pattern in this architecture, leading to unnecessary data transfer and slower rendering, especially on dashboard metrics.
**Action:** Always implement a dedicated `getCount` service method utilizing Supabase's `{ count: 'exact', head: true }` parameter when only record counts are required.
