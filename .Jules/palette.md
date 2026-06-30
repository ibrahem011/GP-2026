## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-06-30 - Accessible Theme Toggle Button
**Learning:** Icon-only toggle buttons using text ligatures (like Material Symbols) need robust accessibility attributes. In this RTL context, simply using 'dark_mode' or 'light_mode' text inside the icon span is read incorrectly or confusingly by screen readers.
**Action:** Always add Arabic `aria-label` and `title` to the button for screen readers and tooltips, set `aria-hidden="true"` on the inner text-ligature span to hide the icon text, and apply `focus-visible` classes to ensure the button is navigable via keyboard.
