## 2026-05-16 - Accessibility improvements for native RTL context
**Learning:** In native RTL Arabic applications, accessibility strings (like `aria-label`) occasionally default to English. This causes a confusing experience for screen reader users expecting an Arabic context.
**Action:** We must strictly enforce Arabic accessibility contexts. For icon-only buttons, always localize `aria-label`, add localized `title` tooltips for sighted users, apply visible focus states, and hide inner decorative icons from screen readers (`aria-hidden="true"`).
