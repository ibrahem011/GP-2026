## 2025-02-18 - Prevented list re-renders with React.memo and useCallback
**Learning:** List components rendering frequently with primitive props but triggering parent state updates via callbacks break React.memo() optimization.
**Action:** When wrapping a frequently rendered list component (e.g. `PropertyCard`) in `React.memo()`, ensure parent components use `useCallback` to pass stable callback references to preserve rendering performance.
