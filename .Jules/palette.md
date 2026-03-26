## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-03-15 - Missing ARIA Labels and Hidden States on Material Icons
**Learning:** Decorative Material Symbols (e.g., `<span className="material-symbols-outlined">expand_more</span>`) rely on English text ligatures. In this Arabic Right-To-Left (RTL) app, screen readers read these English ligatures aloud (e.g., "expand more", "delete") if they are not hidden, confusing users navigating an Arabic interface. Additionally, icon-only buttons or links lack descriptive Arabic labels for screen reader context.
**Action:** Always add `aria-hidden="true"` to decorative Material Symbol icons to hide the English ligatures from screen readers. Provide context for icon-only interactive elements by explicitly adding descriptive Arabic `aria-label`s (e.g., `aria-label="حذف العقار"`).
