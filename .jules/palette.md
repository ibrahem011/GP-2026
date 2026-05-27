## 2026-05-27 - [ThemeToggle Accessibility Improvement]
**Learning:** Interactive components like `ThemeToggle` in this RTL application often default to English labels and lack proper focus styles and tooltips. Given the RTL Arabic context, these attributes must be explicitly localized in Arabic.
**Action:** Always provide explicitly localized Arabic `aria-label` and `title` attributes, apply `focus-visible` utility classes for keyboard navigation, and add `aria-hidden="true"` to decorative inner icons for any icon-only interactive components.
