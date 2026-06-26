## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2026-06-26 - Missing aria-pressed on Toggleable UI Controls
**Learning:** Custom toggleable UI controls like view mode switchers (list/grid) or filter chips often change visual styling to indicate active state, but without `aria-pressed` these state changes are completely invisible to screen readers.
**Action:** Always dynamically bind `aria-pressed={activeState}` to toggle buttons and filter chips to correctly communicate their toggled status to assistive technologies.
