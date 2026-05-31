## 2026-05-31 - [Memoize PropertyCard Component]
**Learning:** In Next.js client components, frequently rendered list items that receive primitive props and callbacks from parent components (like `PropertyCard`) will re-render needlessly when parent state (like debounced search inputs) updates. Wrapping them in `React.memo` is a safe, simple, and effective optimization.
**Action:** Always verify if frequently rendered components in lists are memoized, especially if they are heavily styled or contain complex UI.
