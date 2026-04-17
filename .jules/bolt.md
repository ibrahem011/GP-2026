
## 2024-04-17 - React.memo Optimization for Frequently Rendered Components
**Learning:** The `PropertyCard` component, due to being rendered inside lists that frequently update their state (e.g., via filtering, sorting, or view mode toggling in parent components like `SearchPageClient` and `FavoritesPage`), can cause significant performance bottlenecks due to unnecessary re-renders.
**Action:** Always consider wrapping frequently rendered list item components with `React.memo()`, especially if their parent components undergo frequent state updates that don't affect the list item's actual props.
