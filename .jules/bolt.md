
## 2024-03-29 - Supabase Exact Count Query Optimization
**Learning:** Fetching all rows (e.g., `getProperties()`) just to calculate the length (e.g., `length`) causes an N+1-style data transfer bottleneck, severely impacting backend performance and memory when the dataset grows.
**Action:** Use `{ count: 'exact', head: true }` in the `.select('*')` query to retrieve only the numeric count from the database, and pair it with a `.limit(x)` query if a subset of actual row data is still needed for UI rendering.
