## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2026-06-02 - [Add Arabic ARIA labels and focus-visible styles to ThemeToggle]
**Learning:** In RTL/Arabic contexts, interactive elements lacking visible text (like icon buttons) must have localized `aria-label` attributes and should include `focus-visible` styles for proper keyboard navigation. Decorative icons inside these buttons should have `aria-hidden="true"` to prevent redundant screen reader announcements.
**Action:** Ensure all icon-only buttons include localized `aria-label`s and `title`s for tooltips, along with explicit `focus-visible` states and `aria-hidden` on decorative children.
