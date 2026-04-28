# Supabase package analysis

## Executive summary

I did **not** find a single catastrophic syntax conflict in the SQL files by static inspection, but I found several **deployment conflicts / stale-file mismatches** that can break a real deployment flow.

The biggest issue is that the `manual/` files are **not aligned** with the current `migrations/` folder.

## High-risk findings

1. **`manual/MASTER_SCHEMA.sql` is stale relative to migrations 006, 009, and 010.**
   - It still contains `profiles.national_id`.
   - It does **not** include:
     - `get_user_bookings()` from `migrations/006_user_data_fetch.sql`
     - `get_user_favorites()` from `migrations/006_user_data_fetch.sql`
     - `user_secrets` table from `migrations/009_admin_system_expansion.sql`
     - `system_settings` table from `migrations/009_admin_system_expansion.sql`
     - profile admin/archive/block columns from `migrations/009_admin_system_expansion.sql`
     - `admin_transition_booking_status()` from `migrations/009_admin_system_expansion.sql`
     - `bookings.landlord_note` and `bookings.landlord_note_updated_at` from `migrations/010_booking_landlord_notes.sql`
     - the new 3-argument `transition_booking_status(..., p_landlord_note)` from `migrations/010_booking_landlord_notes.sql`

2. **`manual/functions.sql` is also stale.**
   - It still defines the old 2-argument `public.transition_booking_status(UUID, TEXT)`.
   - If someone runs `manual/functions.sql` after migration 010, the database can end up with both:
     - `transition_booking_status(UUID, TEXT)`
     - `transition_booking_status(UUID, TEXT, TEXT DEFAULT NULL)`
   - That creates an overload situation and makes the deployment path harder to reason about.

3. **`README.md` is outdated operationally.**
   - It explains deployment mainly around `008_booking_storage_hardening.sql` and does not guide the user through `006`, `009`, and `010`.
   - This can cause a new project to be bootstrapped with `manual/MASTER_SCHEMA.sql` only, leaving the DB behind the real migration state.

4. **`migrations/009_admin_system_expansion.sql` is not rerun-safe as written.**
   - Policies are created without `DROP POLICY IF EXISTS`.
   - The `INSERT INTO public.user_secrets ... SELECT id, national_id FROM public.profiles` statement will fail on rerun after `national_id` has already been dropped.

## Medium-risk findings

1. **`admin_transition_booking_status()` security conventions are inconsistent.**
   - It is `SECURITY DEFINER` but the original file does not set `search_path = public`.
   - Unlike other RPC functions, the original file does not explicitly `REVOKE` / `GRANT EXECUTE`.

2. **The manual snapshot strategy and migration strategy diverged.**
   - `manual/MASTER_SCHEMA.sql` behaves like a snapshot near the state of migration 008.
   - The migration folder continued evolving through 009 and 010 without the manual snapshot being regenerated.

## What I generated for you

1. **`supabase_fresh_install_merged.sql`**
   - For a **brand-new project**.
   - Starts from `manual/MASTER_SCHEMA.sql` and appends the missing logic from migrations 006, fixed 009, and 010.

2. **`supabase_upgrade_existing_fixed.sql`**
   - For an **existing project** already around the `manual/MASTER_SCHEMA.sql` / migration-008 state.
   - Applies the missing pieces from 006, fixed 009, and 010 only.

## Recommended deployment paths

### New project
Run:
- `supabase_fresh_install_merged.sql`

Do **not** run the old `manual/MASTER_SCHEMA.sql` by itself anymore.

### Existing project already on the older manual snapshot / up to migration 008
Run:
- `supabase_upgrade_existing_fixed.sql`

### Important warning
Do **not** run the original `manual/functions.sql` after applying the new upgrade, because it still contains the old 2-argument `transition_booking_status` definition.

## Static-analysis limitation

This review was done by **static inspection** of the SQL package. I did not execute it inside a live PostgreSQL/Supabase instance in this environment, so I can confirm the structural conflicts above, but not runtime behavior against your exact production data.
