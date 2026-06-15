## 2026-06-15 - PropertyCard Memoization
**Learning:** In the Next.js frontend codebase, frequently rendered list components (like PropertyCard) that receive primitive props should be wrapped in React.memo to prevent unnecessary re-renders cascading from frequent parent state updates (such as debounced search query changes).
**Action:** Always wrap list components with React.memo when they are rendered inside lists with frequent state updates.

## 2026-06-15 - PropertyCard Context Memoization
**Learning:** Components using Context API (like `useAuth` or `useFavorites`) will always re-render when the context changes, circumventing `React.memo`. However, wrapping them in `React.memo` with a custom comparison function that ignores context-derived props or function references (like `onFavoriteChange`) is still crucial to prevent them from re-rendering purely due to parent state updates (e.g., search filters changing).
**Action:** When memoizing list items that consume Context, provide a custom comparison function to `React.memo` that compares only the relevant scalar props (id, title, price, etc.) and ignores inline functions or context-managed state to ensure the memoization is actually effective against parent renders.
