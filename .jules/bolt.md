## 2026-06-11 - PropertyCard Memoization
**Learning:** In a list of cards, wrapping with React.memo() prevents re-renders due to parent component state changes (such as debounced search or generic list wrappers), saving numerous render cycles when navigating list views.
**Action:** Wrap frequently rendered list components that receive primitive props with React.memo().
