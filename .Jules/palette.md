## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).

## 2024-03-24 - [Add missing ARIA labels to icon-only buttons]
**Learning:** Found several icon-only buttons (like notifications, logout, and favorites) missing `aria-label` attributes. This is a common accessibility issue that prevents screen readers from announcing the button's purpose.
**Action:** Always add descriptive `aria-label` attributes to icon-only buttons. For toggle buttons, use dynamic labels (e.g., `aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}`).
