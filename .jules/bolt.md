## 2026-06-12 - React.memo for List Components
**Learning:** In the Next.js frontend codebase, frequently rendered list components (like `PropertyCard`) that receive primitive props should be wrapped in `React.memo` to prevent unnecessary re-renders cascading from frequent parent state updates (such as debounced search query changes).
**Action:** Always verify if components rendered in lists within heavy parent components (like Search or Home pages) can benefit from `React.memo` optimization, ensuring props are suitably memoized or primitive.
