## 2024-03-24 - Wrapped PropertyCard with React.memo
**Learning:** Frequently rendered list components (like `PropertyCard`) that receive primitive props should be wrapped in `React.memo` to prevent unnecessary re-renders cascading from frequent parent state updates (such as debounced search query changes).
**Action:** Always consider `React.memo` for list item components, especially when they are rendered in large numbers or within parents that update frequently.
