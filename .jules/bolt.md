## 2026-06-05 - [Memoize PropertyCard Component]
**Learning:** In list views that are prone to frequent search/filter re-renders, complex presentational components like PropertyCard will constantly re-render unless explicitly wrapped in `React.memo`, wasting significant main thread CPU cycles.
**Action:** Always wrap frequently rendered list-item components (like PropertyCard) in `React.memo` to prevent unnecessary cascading re-renders when parent states change, matching the guideline in the memory bank.
