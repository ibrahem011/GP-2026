## 2026-05-02 - Focus indicators for keyboard accessibility
**Learning:** Found multiple instances where interactive elements like toggle buttons and filter chips lacked explicit keyboard focus indicators and toggle states. This is a common pattern for custom components that don't use native HTML form controls perfectly.
**Action:** Always verify custom toggleable interactive elements like chips or theme togglers have explicit `focus-visible` utility classes for keyboard users, and use `aria-pressed` to semantically represent active states.
