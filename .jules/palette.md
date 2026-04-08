## 2024-04-08 - Accessible Search Bar
**Learning:** Found an interactive search component (`HomeSearchBar`) that was implemented as a `div` with an `onClick` handler, lacking semantic meaning, `aria-label`, and keyboard focus support. The search bar is a crucial element for navigation but was completely hidden from screen readers.
**Action:** Always ensure critical interactive elements, especially primary actions like a search bar, use semantic `<button>` tags with appropriate `aria-label`s, rather than non-interactive container tags with click handlers.
