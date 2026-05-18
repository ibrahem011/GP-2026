## 2024-05-18 - React.memo Optimization for PropertyCard
**Learning:** List items like `PropertyCard` receiving primitive props in heavily re-rendered contexts (like parent search result debouncing) can cause significant UI stuttering due to cascading re-renders.
**Action:** Always wrap frequently rendered list elements (e.g. `PropertyCard`, `MyPropertyCard`) with `React.memo()` in React, especially in Next.js applications where search or map updates can trigger rapid un-optimized parent re-renders.
