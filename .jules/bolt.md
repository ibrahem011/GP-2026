## 2026-05-30 - [Avoid Cascading Re-renders in Lists]
**Learning:** Wrapping list components like `PropertyCard` in `React.memo` prevents unnecessary re-renders when parent state (like search queries) updates frequently.
**Action:** Always consider `React.memo` for frequently rendered components that receive mostly primitive props.
