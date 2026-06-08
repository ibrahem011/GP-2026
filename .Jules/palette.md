## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2026-06-08 - Accessible Toggle States for Icon Buttons
**Learning:** In addition to `aria-label`, icon-only toggle buttons (like list/grid view switchers) must communicate their active state to screen readers. Relying solely on visual cues (like changing background/text color) is inaccessible. Using `aria-pressed` explicitly announces the toggled state to screen readers in real-time.
**Action:** Always add `aria-pressed={isActive}` to toggleable icon buttons, alongside explicit Arabic `aria-label`s and keyboard focus styles (`focus-visible:ring`).
