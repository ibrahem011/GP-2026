## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2026-06-19 - Added aria-hidden to decorative icons next to visible text
**Learning:** Material Symbols use text ligatures (like 'tune', 'sort') which screen readers will read aloud. If the button already has visible text (like 'فلترة'), this creates a redundant and confusing experience (e.g. 'tune فلترة').
**Action:** Always add `aria-hidden="true"` to decorative `<span className="material-symbols-outlined">` elements when they are accompanied by visible text or when the parent interactive element already has an `aria-label`.
