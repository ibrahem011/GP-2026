## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-03-16 - Missing ARIA Labels on Icon-Only Layout Toggles
**Learning:** Icon-only buttons used for layout toggling (e.g., list vs. grid view in PropertyFilters) lacked proper screen reader context and keyboard focus styling, making them inaccessible for users relying on assistive technologies or keyboard navigation.
**Action:** Always add English `aria-label` attributes for screen readers, `focus-visible:ring-2 focus-visible:outline-none` classes for keyboard focus visibility, and `aria-hidden="true"` to inner icon elements on all icon-only buttons.
