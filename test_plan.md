1. **Optimize `PropertyCard` Component**
   - Use `React.memo` for `PropertyCard` in `src/components/PropertyCard.tsx`.
   - Update `export function PropertyCard(...)` to `const PropertyCardComponent = function(...)` and `export const PropertyCard = React.memo(PropertyCardComponent);`
   - This prevents unnecessary re-renders of the list of properties when parent components (like the search page) update state that doesn't affect individual properties.
2. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run the full test suite and linters to verify the change is safe.
   - Review the codebase for regressions.
3. **Submit the change**
   - Submit PR with the correct format for the Bolt persona.
