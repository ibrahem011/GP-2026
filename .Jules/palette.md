## 2026-03-15 - Missing ARIA Labels on Custom Increment/Decrement Controls
**Learning:** Custom UI controls for numeric filters (like bedrooms and bathrooms) in this app use icon-only buttons (+/-) without native `<input type="number">`. These were missing `aria-label` attributes, rendering them completely opaque to screen readers, especially in the Right-To-Left (RTL) Arabic context.
**Action:** Always verify icon-only interactive elements in custom filter components and explicitly add Arabic `aria-label`s to provide context (e.g., 'زيادة عدد غرف النوم' for incrementing bedrooms).
## 2024-04-13 - [Focus state timeouts with Playwright in sandbox]
**Learning:** In the sandbox environment, explicitly calling `.focus()` on dynamically loaded elements or icons wrapped in spans might timeout for Playwright.
**Action:** When capturing keyboard focus states in `verify_a11y.py` scripts, fallback to simulating standard `Tab` navigation loops (e.g. `page.keyboard.press("Tab")`) rather than attempting direct `.focus()` locators if timeouts occur.
