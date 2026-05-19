## 2026-05-19 - Missing React.memo on Frequently Rendered List Components
**Learning:** In this codebase, the PropertyCard component is rendered very frequently in lists (search results, favorites, my-properties) but was missing React.memo, leading to unnecessary re-renders when parent states like search filters change.
**Action:** Always verify if frequently rendered components that receive primitive props are properly memoized to prevent cascading re-renders.
