## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2024-03-24 - Screen Reader Compatibility for Material Icons
**Learning:** In this Arabic (RTL) Next.js application, Material Icons are rendered using font ligatures (e.g., `<span className="material-symbols-outlined">favorite</span>`). Without `aria-hidden="true"`, screen readers will read the English ligature text aloud in an otherwise Arabic interface, causing severe confusion.
**Action:** Always add `aria-hidden="true"` to decorative Material Icons and provide an `aria-label` on their parent interactive element (like a button) in Arabic to ensure a cohesive and accessible experience.
