## 2024-05-24 - Memoize frequently rendered list components
**Learning:** In Next.js/React, components rendered in long lists like PropertyCard suffer from cascading re-renders when parent components update (e.g. debounced search filters). If they accept mostly primitive props, they are perfect candidates for `React.memo`.
**Action:** Always wrap frequently rendered list items in React.memo to improve rendering performance and reduce main thread blocking.
