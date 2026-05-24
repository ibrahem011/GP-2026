## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2026-05-24 - Localized Accessibility for Global Toggles
**Learning:** Global components like theme togglers in an RTL Arabic app need fully localized accessibility attributes, not just English defaults, to be correctly parsed by localized screen readers.
**Action:** Ensure that all non-text, icon-only interactive controls (like dark mode switches) have Arabic `aria-label`s and `title`s along with explicitly hiding inner icons with `aria-hidden='true'`.
