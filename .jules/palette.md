## 2024-05-18 - [Add aria labels to Arabic icon buttons]
**Learning:** In an explicitly RTL/Arabic context, `aria-label` attributes for icon-only buttons must be written in Arabic to provide correct context to screen readers, and icons like material symbols should be explicitly hidden from screen readers using `aria-hidden="true"`.
**Action:** Always verify the language context (e.g., `dir="rtl"` or application requirements) and add Arabic `aria-label`s along with `aria-hidden="true"` on the underlying icons for all icon-only interactive elements.
