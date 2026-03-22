## 2024-03-24 - [Add Promise Deduplication and Caching for getPropertyById]
**Learning:** For frontend N+1 query bottlenecks in this specific architecture, using a simple module-level `Map` for in-flight promise deduplication combined with a short-lived cache works effectively and safely within Supabase service modules like `propertyService.ts`.
**Action:** Always check if a method is called frequently and concurrently (e.g. by components independently fetching data) and use an in-flight promise cache and a simple cache TTL strategy to avoid N+1 and duplicate queries.
