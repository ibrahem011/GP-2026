## 2024-05-24 - Missing Arabic Localization on Icon Buttons
**Learning:** Icon-only interactive elements (like `ThemeToggle`) sometimes default to English `aria-label`s, which disrupts the experience for screen readers in this Right-To-Left (RTL) Arabic context application.
**Action:** Always verify that `aria-label`s on icon-only buttons are explicitly localized to Arabic and include `focus-visible` styles for keyboard users.
