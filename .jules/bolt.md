## 2024-05-18 - Prevent Unnecessary Re-renders in Lists
**Learning:** Frequent parent state updates (like debounced search query changes) cause all child components in a list to re-render, creating significant performance overhead.
**Action:** Always consider `React.memo` for heavily reused components like `PropertyCard` when they receive stable or primitive props to avoid cascading re-renders in large lists.
