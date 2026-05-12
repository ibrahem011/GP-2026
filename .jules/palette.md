## 2024-05-18 - Added Arabic aria-labels to icon-only buttons
**Learning:** For icon-only interactive elements in an RTL Arabic application, adding localized Arabic `aria-label` attributes and setting `aria-hidden="true"` on the inner icon (e.g., Material Symbols) is crucial to prevent screen readers from reading the literal English icon name (e.g., "send" instead of "إرسال").
**Action:** Always ensure icon-only buttons have accessible names matching the localized context, and explicitly hide decorative/font-based icons from assistive technologies.
