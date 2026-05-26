## 2026-05-26 - [RTL Accessibility for Icon-only Interactive Elements]
**Learning:** In RTL Arabic applications, English `aria-label`s on icon-only buttons create a jarring screen reader experience because the underlying context shifts languages. Additionally, the inner icon node must have `aria-hidden="true"` to prevent redundant reading.
**Action:** Always provide translated `aria-label`s (e.g. Arabic) along with `title` tooltips for icon-only buttons. Add `aria-hidden="true"` to the inner icon element, and explicitly apply keyboard-focus styles via `focus-visible:ring-*`.
