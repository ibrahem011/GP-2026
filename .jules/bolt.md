## 2024-06-14 - React.memo on List Components
**Learning:** The `PropertyCard` component is frequently rendered in lists and grids across the application. Since it receives mostly primitive props but can be triggered to re-render by parent components (like search or filtering), wrapping it in `React.memo()` is a classic and effective React performance optimization to prevent unnecessary re-renders cascading down from state updates.
**Action:** Always consider `React.memo()` for frequently rendered list items that receive primitive props to optimize rendering performance.
