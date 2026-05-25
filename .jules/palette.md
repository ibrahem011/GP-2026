## 2026-05-25 - Localized Icon-Only Button A11y
**Learning:** In an RTL Arabic application context, English `aria-label`s on icon-only buttons create a disjointed screen reader experience, and missing `title` attributes leave sighted users without tooltips for abstract icons.
**Action:** When implementing icon-only buttons, always provide a localized Arabic `aria-label`, mirror it in the `title` attribute for sighted users, apply `aria-hidden="true"` to the internal icon element, and ensure explicit focus states.
