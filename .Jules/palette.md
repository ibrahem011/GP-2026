## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-06-28 - Adding accessibility attributes to dropdown trigger buttons and icons
**Learning:** Dynamic dropdown triggers like notifications buttons require `aria-expanded` bound to their boolean open state to correctly communicate visibility status to screen readers. Furthermore, decorative Material Symbols text ligatures (e.g., 'notifications') must have `aria-hidden="true"` to prevent screen readers from reading the ligature text out loud, especially when an `aria-label` already provides the necessary context.
**Action:** Always bind `aria-expanded` to the visibility state of dynamically toggled elements, ensure trigger buttons have an explicit `aria-label`, and hide inner decorative ligatures from screen readers using `aria-hidden="true"`.
