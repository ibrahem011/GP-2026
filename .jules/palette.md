## 2026-05-31 - [RTL Icon-Only Button Accessibility]
**Learning:** [In an Arabic RTL context, English aria-labels on icon-only buttons create a jarring screen reader experience. Additionally, relying solely on aria-labels omits tooltips for sighted users who may not immediately recognize the icon's function.]
**Action:** [Always use localized (Arabic) aria-labels for screen readers, add a localized title attribute for visual tooltips, and apply focus-visible styling (ring-2) to support keyboard navigation. Inner icons must be hidden with aria-hidden="true" to prevent redundant announcements.]
