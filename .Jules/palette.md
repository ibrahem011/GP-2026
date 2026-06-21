## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-06-21 - Missing ARIA Labels on Header Icon Actions
**Learning:** Interactive icon-only header buttons (such as back, call, options, or support) are frequently missing `aria-label` attributes, rendering them inaccessible to screen readers in the app's RTL context. Additionally, Material Symbol text ligatures inside these buttons aren't hidden from screen readers.
**Action:** When implementing header action buttons, always apply focus-visible rings for keyboard navigation, Arabic `aria-label` and `title` for context/tooltips, and `aria-hidden="true"` on the inner decorative icon element.
