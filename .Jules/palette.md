## 2024-05-19 - Accessibility Improvements for ChatInput

**Learning:** When using decorative Material Icons (like `<span className="material-symbols-outlined">`) inside buttons or other interactive elements, they often lack proper ARIA attributes, making them inaccessible to screen readers. Specifically in the ChatInput component, many icon-only buttons (like attachment, emoji, send, mic, delete, and stop recording) lacked `aria-label`s, and the decorative icons did not have `aria-hidden="true"`.

**Action:** Consistently add descriptive `aria-label` attributes to all icon-only buttons, and ensure that decorative icons inside these buttons have `aria-hidden="true"` to prevent screen readers from reading meaningless text. This applies to all similar icon-based interactive elements across the application to improve overall accessibility.
