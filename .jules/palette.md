## 2024-04-26 - Missing Accessible Labels on Icon-only Buttons
**Learning:** Found several icon-only buttons (like notifications trigger and logout in Header.tsx, and theme toggle in ThemeToggle.tsx) lacking proper `aria-label`s for screen readers. Also observed `aria-label` present but not localized in some areas, but the context here is Arabic so they should be localized.
**Action:** Always ensure icon-only interactive elements have an `aria-label` attribute describing their action, especially critical header functions.
