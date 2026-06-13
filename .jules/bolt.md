## 2026-06-13 - React.memo for frequent lists
**Learning:** In Next.js App Router applications, frequently rendered list components like `PropertyCard` that receive mostly primitive props can cause unnecessary cascading re-renders when parent states (like debounced search queries or complex filter structures) update frequently.
**Action:** Wrap these list items in `React.memo` to halt the render cascade, significantly improving rendering performance during fast user interactions such as typing in a search bar.
