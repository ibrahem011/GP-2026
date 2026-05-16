## 2026-05-16 - [Memoize PropertyCard list component]
**Learning:** In the Next.js frontend codebase, frequently rendered list components (like `PropertyCard`) that receive primitive props should be wrapped in `React.memo` to prevent unnecessary re-renders cascading from frequent parent state updates (such as debounced search query changes).
**Action:** When working on complex list views or search results, always verify if the child components are memoized. If not, evaluate their prop stability and apply `React.memo()` to optimize rendering performance.
