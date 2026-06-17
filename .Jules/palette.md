## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2024-06-17 - Accessible Icon-Only Close Buttons in Overlays
**Learning:** Icon-only close buttons (like an 'X' icon) within dynamic UI overlays (e.g., NotificationsPopover, NotificationsSheet) often lack screen reader context, appearing completely unlabeled to assistive technologies.
**Action:** Always provide explicit Arabic `aria-label` attributes (e.g., `aria-label="إغلاق"`) on icon-only close buttons, and add `aria-hidden="true"` to the inner decorative icon elements (like `<span className="material-symbols-outlined">`) to ensure proper screen reader pronunciation.
