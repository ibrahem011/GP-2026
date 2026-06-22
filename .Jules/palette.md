## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2026-06-22 - Prevent Screen Readers from Announcing Ligature Text
**Learning:** When using font-based icons (like Material Symbols) inside an interactive element that already has an `aria-label`, screen readers may confusingly read out the English ligature text (e.g., 'add' or 'remove') alongside the Arabic label if the icon isn't explicitly hidden.
**Action:** Always add `aria-hidden="true"` to the inner `span` containing the icon ligature whenever the parent button has its own `aria-label`.
