## 2026-06-09 - [Theme Toggle Accessibility]
**Learning:** In RTL (Arabic) applications using Material Symbols ligatures, wrapping the icon text in a screen reader hidden `span` and giving the interactive element an explicitly localized `aria-label` prevents the English ligature text from being voiced during navigation.
**Action:** Always add `aria-hidden="true"` to ligature-based icons inside actionable components while providing Arabic `aria-label` on the parent.
