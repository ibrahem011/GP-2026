
## 2026-04-30 - Interactive Toggles Accessibility
**Learning:** Toggle buttons (like list/grid view, theme switchers, or filter chips) often lack state indication for screen readers, meaning users hear 'button' without knowing if it's currently active. Additionally, in RTL (Right-to-Left) applications, ensuring `aria-label`s for icon-only buttons are in the localized language (e.g., Arabic) is crucial for screen reader context.
**Action:** When creating or updating toggle buttons, always add `aria-pressed={isActive}` to convey the current state to screen readers. For icon-only buttons, hide the inner icon from screen readers using `aria-hidden="true"` and provide a properly translated `aria-label`.
