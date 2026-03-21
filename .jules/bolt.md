## 2025-03-01 - [Supabase Count Query Optimization]
**Learning:** In Supabase, fetching all rows to calculate the length of an array on the client side causes excessive data transfer and memory usage, creating an N+1 query bottleneck.
**Action:** Use `{ count: 'exact', head: true }` parameter on `.select('*')` to optimize count queries and prevent excessive data transfer. This avoids loading thousands of objects into memory on the client side.
