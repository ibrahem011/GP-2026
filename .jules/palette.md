## 2026-05-28 - Localized Aria Labels & Tooltips for Icon Buttons
**Learning:** In an Arabic (RTL) context, it's easy to overlook English `aria-label`s left in code. Furthermore, icon-only buttons need both localized `aria-label`s for screen readers AND a `title` attribute to provide tooltips for sighted users who may not immediately recognize the icon's function.
**Action:** Always check that both `aria-label` and `title` are provided, in Arabic, for icon-only interactive elements in RTL environments.
