## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-03-15 - Missing Arabic ARIA Labels in Generic Components
**Learning:** Even generic utility components like a `ThemeToggle` that seem visual-only or use English icons ('light_mode' / 'dark_mode') must have their `aria-label` explicitly localized to Arabic ('التبديل إلى الوضع الفاتح') to ensure proper screen reader support and avoid jarring voice context switching in an RTL application.
**Action:** Always ensure `aria-label` attributes are localized to Arabic and add `aria-hidden="true"` to ligature-based icon elements (`<span className="material-symbols-outlined">`) to hide them from assistive technologies.
