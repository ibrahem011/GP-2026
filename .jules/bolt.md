## 2025-03-17 - [Concurrent Database Operations using Promise.all]
**Learning:** Found sequential Supabase API calls in `messagingService.ts`. Sequential queries fetching the same table data by different roles (e.g., `buyer_id` and `owner_id`) cause N+1 database roundtrips.
**Action:** Always wrap independent API calls in `Promise.all` to fetch data concurrently. This significantly speeds up resolution time, particularly for user-facing network queries.
