## 2026-06-16 - [Memoize List Components]
**Learning:** Next.js frequently re-renders list items (like PropertyCard) during parent state changes, causing significant main thread blockage. These components often receive identical primitive props.
**Action:** Use React.memo to wrap list components that receive primitive props to prevent cascading re-renders.
