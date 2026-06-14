## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-06-14 - Missing aria-pressed on Custom Toggle Filters
**Learning:** Custom UI toggle controls (like filter chips and category buttons) frequently omit the `aria-pressed` attribute. While they visually indicate their active state via styling, screen readers need `aria-pressed` to understand whether the toggle is currently active or inactive.
**Action:** Always verify that interactive custom toggle elements include the `aria-pressed` attribute, dynamically set to the active state boolean, to ensure state changes are communicated to assistive technologies.
