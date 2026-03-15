# Execution PR Plan

## Phase 2

### Task 2.3 Audit Note
- Audit Complete: no `.select('id')` found for `unlocked_properties` in `src/services/supabaseService.ts`; composite key `(user_id, property_id)` usage confirmed.
- RLS gap for `unlocked_properties` is closed under Task 2.3 using Compatibility Lock (RPC signature maintained).

### PR2 — Role Enum Unification
- DB migration added to normalize and enforce canonical roles.
- App checks migrated to shared role normalization layer (`src/lib/roles.ts`).
- Permission logic no longer depends on Arabic role literals.
- Production dependency after Task 2.3 resolved by PR2.

### Task 2.4 Verification Guards
- Storage Audit: `STORAGE_BUCKET` has no active circular dependency. A static verification guard now enforces a dependency-free `storageBucket` leaf module and prevents `supabase.ts` from importing `storage.ts`.

### Deferred Epic â€” Rate Limiter
- `Rate Limiter` implementation is deferred to a dedicated Epic because `middleware.ts` / `rateLimit.ts` are not present in the current branch.

### SQL Pre-Flight (Required)
- Before pushing SQL migrations, run a conflict-marker check on `supabase/**/*.sql` to ensure no unresolved merge markers are present.
