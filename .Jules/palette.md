## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-03-22 - Material Icon Ligatures and aria-hidden
**Learning:** This application heavily uses Material Symbols with ligatures (e.g., `<span className="material-symbols-outlined">logout</span>`). By default, screen readers will read the ligature text ("logout" or "notifications"), which is confusing when the surrounding text or `aria-label` is in Arabic.
**Action:** Always add `aria-hidden="true"` to decorative ligature icon spans, and rely entirely on `aria-label`s on the parent `<button>` for screen reader accessibility in Arabic.
