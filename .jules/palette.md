## 2024-06-11 - Add ARIA Labels to Notification Close Buttons
**Learning:** Icon-only close buttons in modals/popovers often lack context for screen readers. In right-to-left (RTL) Arabic applications, it is critical to explicitly add Arabic `aria-label`s like `aria-label="إغلاق"` to these elements.
**Action:** Always verify that every icon-only button, especially close (`X`) buttons in sheets and popovers, includes a descriptive `aria-label` matching the application's locale.
