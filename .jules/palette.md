## 2024-04-12 - [Accessible Search Filters]
**Learning:** Found that custom search filters utilizing generic buttons and inputs often lack native screen reader context. Explicitly linking `<label>` elements via `htmlFor`+`id` and tracking active states with `aria-pressed` on toggle buttons significantly improves the experience for assistive technology without altering visual styling.
**Action:** Always ensure that custom interactive components (like toggleable filter chips or price ranges) have explicit accessible labels and state indicators (e.g., `aria-pressed`) implemented by default.
