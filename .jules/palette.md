
## 2026-05-13 - Icon-Only Buttons in RTL Arabic Context
**Learning:** In a strictly Right-To-Left (RTL) Arabic context, accessibility attributes for icon-only buttons (like `aria-label` and `title`) must be localized to Arabic to provide correct context to screen readers, overriding any previous default conventions to English. Additionally, visual focus states (`focus-visible:ring-2 focus-visible:outline-none`) are crucial for keyboard navigation visibility, and the inner icon elements must be explicitly hidden (`aria-hidden="true"`) from assistive tech.
**Action:** Always localize `aria-label` and `title` to Arabic for interactive elements, apply robust focus visible styles, and use `aria-hidden="true"` on decorative inner icons.
