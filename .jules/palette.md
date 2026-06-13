## 2026-06-13 - [Add accessibility attributes to toggle buttons and decorative icons]
**Learning:** Custom toggle chips and icon buttons often rely on text ligatures that require `aria-hidden="true"` to avoid redundant announcements, and toggle buttons require `aria-pressed` to announce active states.
**Action:** Always add `aria-hidden="true"` to decorative icons and `aria-pressed` to toggle buttons.
