## 2024-05-24 - [Supabase Storage Image Upload Parallelization]
**Learning:** Sequential await calls in for...of loops when dealing with Supabase storage network requests drastically bottleneck performance. Using Promise.all or Promise.allSettled enables parallel network calls for faster total multi-file execution times and better cleanup reliability on failure.
**Action:** Always prefer Promise.all or Promise.allSettled for multiple independent IO-bound operations such as multi-file uploads or batch deletions.
