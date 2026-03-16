
## 2024-03-16 - [Parallelize DB Reads in Messaging Service]
**Learning:** Sequential independent queries (e.g., getting conversations as buyer and as owner) can occur in service layer functions.
**Action:** Always scan for consecutive `await supabase.from(...)` calls that do not depend on each other and combine them using `Promise.all`.
