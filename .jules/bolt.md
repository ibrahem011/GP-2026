## 2026-06-01 - Wrap PropertyCard in React.memo
**Learning:** PropertyCard is a core component frequently rendered in long lists and heavily updated views (e.g. search pages, home page). Using React.memo on it prevents costly re-renders of the DOM when parent state changes without altering the property data itself.
**Action:** Always wrap frequently rendered list items in React.memo to improve performance, especially when they take static or primitive data.
