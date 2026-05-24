## 2025-05-24 - React.memo on PropertyCard
**Learning:** Component `PropertyCard` is frequently rendered in lists (search results, home page). Parent components triggering state updates for filters or queries cause widespread re-renders of list items.
**Action:** Use `React.memo` to wrap list item components that accept primitive props to prevent unnecessary renders in long lists during filtering and interaction.
