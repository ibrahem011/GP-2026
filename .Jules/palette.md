## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-07-03 - Focus Visibility on Hover-Revealed Actions
**Learning:** Image deletion buttons on the 'Add Property' page were hidden by default (`opacity-0`) and only revealed on mouse hover (`group-hover:opacity-100`), making them completely invisible to keyboard navigators even when focused, since they lacked `focus-visible` utility classes. Additionally, the icon-only buttons lacked `aria-label`s.
**Action:** When using `group-hover:opacity-100` to conditionally reveal interactive elements, always pair it with `focus-visible:opacity-100` and a clear focus ring (`focus-visible:ring-2 focus-visible:outline-none`) to ensure the action becomes visible when targeted via keyboard navigation. Ensure icon-only buttons receive an `aria-label`.
