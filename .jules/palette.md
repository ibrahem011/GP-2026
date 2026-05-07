## 2025-05-07 - ThemeToggle RTL Arabic Accessibility
**Learning:** Icon-only interactive elements in this RTL Arabic application must have localized `aria-label` and `title` attributes for screen readers and tooltips respectively, along with `aria-hidden="true"` on the inner icons (like Material Symbols) to prevent the screen reader from reading the icon ligatures instead of the accessible label.
**Action:** When implementing or fixing icon-only buttons, always ensure proper Arabic accessibility attributes, tooltip parity, and keyboard focus states (`focus-visible:ring-2`) are applied.
