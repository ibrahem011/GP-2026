## 2024-05-24 - Parallelize I/O Operations
**Learning:** Sequential `for` loops for network I/O operations (like `uploadImage` or `deletePropertyImage`) introduce an O(N) wait time bottleneck. For file deletions during error recovery, sequential failures can also leave trailing orphaned resources.
**Action:** Use `Promise.all(items.map(...))` to parallelize independent network requests, reducing total latency to O(1). Use `Promise.allSettled(...)` specifically for cleanup processes to ensure all tasks execute even if some reject.
