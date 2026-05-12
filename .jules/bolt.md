
## 2024-05-12 - Prevented unnecessary re-renders in PropertyCard
**Learning:** `PropertyCard` is frequently rendered in lists (like search results) with parent components that update often (e.g., debounced search queries). Without memoization, frequent parent state updates cause cascading re-renders of all property cards, hurting performance. Wrapping frequently rendered list components that receive primitive props in `React.memo` effectively mitigates this.
**Action:** Always consider `React.memo` for list items that receive primitive props and are rendered by parents with frequent state changes (e.g., search filters, debounced inputs).
