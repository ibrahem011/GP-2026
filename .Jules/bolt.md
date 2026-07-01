## 2024-07-01 - React.memo() on PropertyCard
**Learning:** List components that render `PropertyCard` inside an inline function for `onFavoriteChange` break React.memo. To properly memoize, we must use `useCallback` and rely on ID rather than property objects in closures.
**Action:** Use `React.memo` on `PropertyCard` but also refactor `onFavoriteChange` to pass only `id` and use `useCallback` inside list components to prevent unnecessary re-renders.
