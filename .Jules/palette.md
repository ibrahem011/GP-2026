## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2026-06-06 - Missing aria-pressed and aria-labels on Custom Toggle Buttons
**Learning:** Custom UI toggle controls (like list vs. grid view modes in PropertyFilters) that use visual styling (colors/shadows) to indicate active state are completely inaccessible to screen readers if they lack `aria-pressed` and `aria-label` attributes.
**Action:** Always verify custom toggle controls and ensure they use `aria-label` for context and `aria-pressed={true/false}` to communicate their current active/toggled state to screen readers.
