## 2024-04-10 - [Avoid Fetching Full Data Just For Counting]
**Learning:** Using `select('*')` (which fetches full row objects and requires parsing) just to get the `length` in JavaScript represents an N+1/Data transfer anti-pattern, particularly over wide or populated tables like `properties`.
**Action:** Always implement and use a `get...Count()` equivalent method leveraging Supabase's `{ count: 'exact', head: true }` parameter when the true count of matching rows is needed, which operates efficiently on the server side without transferring unnecessary data.
