## 2026-06-01 - [Theme Toggle Accessibility in RTL]
**Learning:** In icon-only buttons for this RTL Arabic application, providing only an English `aria-label` fails to give proper context to local screen reader users, and omitting a `title` prevents sighted users from seeing a helpful tooltip.
**Action:** Always localize `aria-label` attributes to Arabic, add corresponding `title` attributes for tooltips, and apply explicit focus-visible classes for keyboard navigation.
