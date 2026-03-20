## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-03-20 - Adding ARIA Context to Header Action Buttons
**Learning:** Icon-only action buttons in the global `Header.tsx` (like Notifications and Logout) used `<span className="material-symbols-outlined">` without `aria-hidden="true"`, causing screen readers to announce meaningless icon names ("notifications", "logout") intermixed with or instead of the intended Arabic translations.
**Action:** Always apply `aria-hidden="true"` to decorative Google Material icon spans, and apply contextual Arabic `aria-label`s to the parent button, ensuring dynamic content (like unread counts) is included in the label for full context.
