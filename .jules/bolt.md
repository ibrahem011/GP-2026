## 2026-05-22 - Memoize list components to prevent cascading re-renders
**Learning:** In Next.js/React codebases, list items (like `PropertyCard`) that receive primitive props and are mapped over inside frequently updating parent components (e.g., search lists, filters) must be wrapped in `React.memo` to prevent unnecessary cascading re-renders on parent state changes.
**Action:** Always wrap standard card components intended for list rendering in `React.memo()` when performance matters, especially if they are pure components driven by primitive props.
