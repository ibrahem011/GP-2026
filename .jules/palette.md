## 2024-05-24 - Initial Entry
**Learning:** Initial Palette memory file created.
**Action:** Ready to start tracking UX and accessibility patterns.

## 2026-06-20 - Accessible Icon Buttons in RTL Context
**Learning:** When using Material Symbols ligatures (e.g., 'notifications') inside icon-only buttons in an RTL/Arabic application, screen readers will incorrectly read the English ligature text if not hidden. Additionally, English aria-labels break the localization flow for RTL screen reader users.
**Action:** Always add `aria-hidden="true"` to the inner `<span className="material-symbols-outlined">`, provide an explicit Arabic `aria-label` on the parent `<button>` or `<a>`, and ensure attributes like `aria-expanded` are present for interactive toggles.
