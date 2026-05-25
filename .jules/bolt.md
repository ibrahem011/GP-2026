## 2024-05-25 - React.memo() on list items
**Learning:** In Next.js App Router with frequent state updates from client components (like search pages), wrapping complex list items in React.memo is critical to avoid cascading render trees.
**Action:** Use React.memo() on any complex, frequently rendered component that receives primitive props, especially if it's rendered inside a list.
