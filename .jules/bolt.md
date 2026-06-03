## 2026-06-03 - [React Performance]
**Learning:** In Next.js App Router, frequently rendered list components (like `PropertyCard`) that receive primitive props or memoized callbacks should be wrapped in `React.memo` to prevent unnecessary cascading re-renders when parent state updates occur (e.g. during frequent search filtering).
**Action:** Always evaluate list items for memoization opportunities, especially when they contain complex UI or images, to reduce the React reconciliation overhead.
