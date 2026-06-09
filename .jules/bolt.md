## 2024-05-18 - Missing memoization for PropertyCard
**Learning:** In the Next.js frontend codebase, frequently rendered list components (like `PropertyCard`) that receive primitive props should be wrapped in `React.memo` to prevent unnecessary re-renders cascading from frequent parent state updates (such as debounced search query changes).
**Action:** Wrap `PropertyCard` with `React.memo` and ensure the exported component is memoized.
