## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-04-18 - Missing Accessibility Support on Core Navigation Icon-only Buttons
**Learning:** Found a recurring pattern across the app where global icon-only actions (like Theme Toggle, Notifications, Logout, and Favorite buttons) lacked visible keyboard focus indicators (`focus-visible`), had screen-reader-visible icon text (Material Symbols missing `aria-hidden="true"`), and were either missing `aria-label`s or using English labels in an RTL Arabic context.
**Action:** When adding or auditing icon-only buttons, consistently apply a tri-fold approach: 1) Localized Arabic `aria-label`s, 2) `aria-hidden="true"` on the inner icon graphic to prevent confusing screen reader announcements, and 3) explicit `focus-visible:ring-2 focus-visible:outline-none` styling for keyboard navigation accessibility.
