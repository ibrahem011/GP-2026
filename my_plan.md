1. I will wrap `PropertyCard` in `React.memo` to prevent unnecessary re-renders.
   - `PropertyCard` is used in lists such as search results (in `src/app/search/client.tsx`) and home page (`src/app/page.tsx`). Search results, especially with filters, may trigger frequent parent re-renders. Memoizing it will avoid re-rendering list items when their props haven't changed.
   - I will rename `export function PropertyCard` to `function PropertyCardComponent`, and add `export const PropertyCard = React.memo(PropertyCardComponent);` at the end of the file.
   - I will also add a bolt journal entry for this optimization.
2. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
3. Submit the change.
