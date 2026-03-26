
## 2024-03-26 - Parallelize Independent Database Queries in Service Methods
**Learning:** Sequential database calls for independent datasets (e.g., fetching a user's conversations as both 'buyer' and 'owner' in separate `.from()` queries) introduce unnecessary latency, which is a common anti-pattern in I/O bound operations within services.
**Action:** When fetching independent datasets that do not rely on each other's results, wrap the Supabase queries in `Promise.all` to run them concurrently. This reduces the total roundtrip time from `queryA_time + queryB_time` to `max(queryA_time, queryB_time)`, noticeably improving performance for operations like fetching conversations.
