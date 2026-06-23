## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-06-23 - Notification Triggers and Icon Ligatures
**Learning:** Notification trigger buttons need `aria-expanded` dynamically bound to their open/closed state to properly communicate the visibility of the notifications popover/sheet to screen readers. Additionally, Material Symbols icon ligatures (like 'notifications', 'chat', 'dark_mode') must have `aria-hidden="true"` when inside an element that already has an `aria-label`, otherwise screen readers will confusingly read the ligature text out loud.
**Action:** Always add dynamic `aria-expanded` to trigger buttons that open menus/popovers, and ensure `aria-hidden="true"` is present on decorative Material Symbols ligatures within accessible interactive elements.
