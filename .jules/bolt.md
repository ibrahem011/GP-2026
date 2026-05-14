
## 2026-05-14 - PropertyCard Re-render Optimization
**Learning:** Next.js list rendering paths like /search and /page loop over primitive datasets, but parent state updates (like debounced filters) can cause unnecessary re-renders of heavy list children.
**Action:** Use React.memo on generic list item components (like PropertyCard) to decouple their render cycle from the parent's when their individual primitive props haven't changed.
