## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-06-25 - Notification Bell A11y & Dropdown Triggers
**Learning:** Stateful dropdown triggers (like the notification bell) often lack `aria-expanded` to communicate their state to screen readers. Also, Material Symbols ligatures and empty visual indicators (like red unread dots) can cause screen readers to read out raw text or stutter if not explicitly hidden.
**Action:** When creating or modifying dropdown/popover triggers, dynamically bind `aria-expanded` to the open state. Always add `aria-hidden="true"` to inner icon elements and visual-only indicators, while ensuring the parent button has a descriptive Arabic `aria-label` (e.g., 'الإشعارات').
