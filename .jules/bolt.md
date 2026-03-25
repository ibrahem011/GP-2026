## 2026-03-25 - [Parallelizing Uploads]
**Learning:** Sequential await loops on IO-bound operations (like image uploads) create artificial bottlenecks.
**Action:** Use Promise.all for independent concurrent uploads.
