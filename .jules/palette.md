
## 2024-04-22 - Notifications Accessibility Polish
**Learning:** In RTL Arabic applications, icon-only buttons like close ('x') buttons often miss semantic meaning for screen readers. Using Arabic `aria-label="إغلاق"` alongside `aria-hidden="true"` on the inner icon structure provides robust screen reader context, while `focus-visible` states ensure keyboard navigability visibility.
**Action:** Always verify keyboard focus rings and use language-appropriate `aria-label` attributes on icon-only interactive elements in RTL-centric apps.
