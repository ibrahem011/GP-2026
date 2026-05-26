## 2024-05-27 - Added React.memo to PropertyCard
**Learning:** In Next.js App Router applications, list components (like PropertyCard) that receive primitive props are often re-rendered unnecessarily when parent components update state (e.g., from search input debouncing or route changes). Wrapping these pure UI components in `React.memo` effectively prevents cascading re-renders, saving significant CPU cycles.
**Action:** For heavily used presentational list components receiving simple props, always wrap with `React.memo` by default to avoid performance bottlenecks.
