## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-03-22 - Material Icons Ligatures and Screen Readers in RTL
**Learning:** Decorative Material icons relying on English text ligatures (e.g., `home`, `search`) in this Arabic (RTL) app are read aloud by screen readers if they lack `aria-hidden="true"`. This confuses users by mixing unrelated English words with Arabic labels (e.g., hearing "home الرئيسية" instead of just "الرئيسية").
**Action:** Always add `aria-hidden="true"` to decorative Material symbol elements (`<span className="material-symbols-outlined">`) to prevent screen readers from reading the underlying English text ligatures aloud.
