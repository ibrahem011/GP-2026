## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2026-06-03 - Missing ARIA Labels and States on Custom Toggle Buttons
**Learning:** Custom UI controls for toggling views (like list vs. grid in PropertyFilters) that rely solely on icons and active styling without explicit ARIA attributes are inaccessible to screen readers. Sighted users see the active state via highlighting and tooltips, but screen readers require  for context and  for state.
**Action:** Always verify custom icon-only toggle buttons and ensure they have explicit Arabic `aria-label`s and dynamic `aria-pressed` attributes reflecting their active state.
## 2025-02-17 - Missing ARIA Labels and States on Custom Toggle Buttons
**Learning:** Custom UI controls for toggling views (like list vs. grid in PropertyFilters) that rely solely on icons and active styling without explicit ARIA attributes are inaccessible to screen readers. Sighted users see the active state via highlighting and tooltips, but screen readers require `aria-label` for context and `aria-pressed` for state.
**Action:** Always verify custom icon-only toggle buttons and ensure they have explicit Arabic `aria-label`s and dynamic `aria-pressed` attributes reflecting their active state.
