## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2026-05-22 - [Link form labels to inputs and indicate active chip state]
**Learning:** [Using useId() ensures robust accessibility mapping for inputs across React forms while aria-pressed improves interaction clarity for interactive chips.]
**Action:** [Always link form labels to their inputs securely with useId() and use aria-pressed for interactive component states.]
