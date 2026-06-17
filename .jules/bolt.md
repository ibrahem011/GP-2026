## 2026-06-17 - Memoizing List Components
**Learning:** In the Next.js frontend codebase, frequently rendered list components (like `PropertyCard`) that receive primitive props can suffer from unnecessary re-renders cascading from parent state updates (such as debounced search queries).
**Action:** Use `React.memo` to wrap these components to prevent unnecessary re-renders and improve performance.
