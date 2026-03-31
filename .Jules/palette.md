## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2024-04-01 - Add ARIA Labels to Icon-Only Buttons and Hide Decorative Icons
**Learning:** Decorative Material Icons (like `<span className="material-symbols-outlined">favorite</span>`) are read aloud by screen readers if `aria-hidden="true"` is not applied. Furthermore, icon-only interactive elements like "Favorite" buttons must have a descriptive `aria-label` to provide context for screen reader users.
**Action:** Ensure all icon-only buttons include an `aria-label` attribute (in Arabic) and all decorative `<span className="material-symbols-outlined">` elements are marked with `aria-hidden="true"`.
