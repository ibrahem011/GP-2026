## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2026-04-02 - Prevent screen readers from announcing Material Icons ligatures
**Learning:** English ligatures in Material Symbols (e.g., 'add', 'remove', 'star') are read aloud by screen readers even in Arabic interfaces, causing severe confusion for RTL users navigating by voice.
**Action:** Always explicitly attach `aria-hidden="true"` to decorative ligature-based icon spans (e.g., `<span aria-hidden="true" className="material-symbols-outlined">`)
## 2026-04-02 - Ensure Icon-Only Buttons Retain Accessible Names When Hiding Ligatures
**Learning:** While hiding decorative Material Symbols ligatures with `aria-hidden="true"` prevents screen readers from reading English text in an Arabic UI, applying this to icon-only buttons without also providing an explicit `aria-label` on the parent `<button>` results in an "empty button" WCAG violation. The screen reader will announce a completely unlabeled, unhelpful button.
**Action:** Always verify that the parent interactive element (like `<button>` or `<a>`) has an explicit localized `aria-label` (e.g., `aria-label="إضافة للمفضلة"`) BEFORE applying `aria-hidden="true"` to its child icon span.
