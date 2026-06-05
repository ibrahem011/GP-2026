## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2026-06-05 - Screen readers reading text ligatures aloud
**Learning:** Material Symbols icons that use text ligatures (e.g., `tune`, `sort`, `map`) must have `aria-hidden="true"` added to their `<span>` wrapper. Otherwise, screen readers will read the ligature text aloud as part of the page content, which is confusing, especially in an Arabic interface where English text suddenly appears.
**Action:** Whenever implementing Material Symbols using text ligatures (e.g., `<span className="material-symbols-outlined">sort</span>`), explicitly add `aria-hidden="true"`.
