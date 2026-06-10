## 2026-06-10 - Optimize PropertyCard re-renders
**Learning:** In Next.js with React, frequently rendered list components like `PropertyCard` that receive primitive props and are mapped over in debounced search queries should be wrapped in `React.memo` to prevent unnecessary re-renders. This is especially true when parent search states update frequently but individual property item props remain identical.
**Action:** Use `React.memo()` on list item components in search/grid pages to improve frontend performance.
