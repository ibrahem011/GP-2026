## 2024-05-19 - Accessible Icon Buttons in Header
**Learning:** Found multiple icon-only buttons (Logout, Notifications) in `src/components/Header.tsx` missing `aria-label` attributes and keyboard focus indicators (`focus-visible:ring`). In a right-to-left (RTL) Arabic context, it is critical to use Arabic `aria-label`s for screen readers.
**Action:** Always add Arabic `aria-label`s and `aria-hidden="true"` to the inner icon element (e.g., Material Symbols) for icon-only buttons, alongside `focus-visible:ring-2 focus-visible:outline-none` for keyboard navigation visibility.
