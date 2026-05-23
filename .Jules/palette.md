## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-05-23 - Adding Accessible Titles to Icon Buttons in RTL
**Learning:** When adding `aria-label`s for screen readers to icon-only buttons in an RTL context, sighted users might still lack context if they hover over the icon. Setting `aria-hidden="true"` on the inner icon and providing both an Arabic `aria-label` and a matching `title` attribute on the button element provides full context for both screen reader and sighted users.
**Action:** For all future icon-only buttons, consistently include both `aria-label` and `title` attributes, and hide the inner icon using `aria-hidden="true"` to prevent redundant screen reader announcements.
