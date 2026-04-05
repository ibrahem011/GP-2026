## 2024-04-05 - Bolt: Optimize Image Uploads using Promise.all/Promise.allSettled
**Learning:** Supabase storage actions in `uploadPropertyImages` and cleanup in `createFullProperty` were being performed sequentially in a loop, resulting in O(n) performance bounds bounded by network latency.
**Action:** Parallelized Supabase I/O tasks using `Promise.all` for uploading and `Promise.allSettled` for cleanup, shifting the bound to roughly O(1) in the ideal concurrent environment.
