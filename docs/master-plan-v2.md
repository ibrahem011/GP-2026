# Master Plan V2

## Phase 2 — Database Alignment & Security

### Task 2.3 Closure
- [x] مراجعة وتأمين `unlocked_properties`.
- [x] تطبيق RLS وحصر الإدخال عبر RPC الآمن.
- [x] توثيق العقد في `docs/db/RLS_CONTRACT_V1.md`.

### PR2 — Role Enum Unification (Production Blocker Closure)

#### Summary
- [x] توحيد الصلاحيات على role canonical فقط: `tenant | landlord | admin`.
- [x] تنظيف القيم العربية/القديمة من DB.
- [x] منع رجوع قيم غير canonical مستقبلًا.

#### Scope
- [x] In scope: DB + TypeScript + permission checks + migration + hard guard.
- [ ] Out of scope: إعادة تصميم RLS خارج ما يتأثر مباشرة بالـ role mapping.
- [ ] Out of scope: تغييرات UX كبيرة خارج labels.

#### Public Interfaces / Types
- [x] `profiles.role` فعليًا canonical فقط.
- [x] توحيد union types على canonical.
- [x] Arabic labels تبقى UI-only عبر map.
- [x] اعتماد helpers موحدة: `normalizeRole` / `isAdminRole` / `isLandlordRole` / `isTenantRole`.

#### Implementation (Done)
- [x] DB migration: `supabase/migrations/20260305000004_role_enum_unification.sql`.
- [x] تحديث trigger `handle_new_user` لتطبيع role إلى canonical.
- [x] إضافة طبقة مركزية: `src/lib/roles.ts`.
- [x] تحديث:
- `src/components/auth/AdminGuard.tsx`
- `src/services/supabaseService.ts`
- `src/hooks/useUser.ts`
- `src/context/AuthContext.tsx`
- `src/app/profile/page.tsx`
- [x] مزامنة ملفات Supabase المرجعية داخل `supabase/manual/` لمنع schema drift.

#### Verification
- [x] `rg -n "'مؤجر'|'مستأجر'|مشرف|مدير" src` → المتبقي فقط داخل labels/mapping.
- [x] `rg -n "role\\s*===|role\\s*!==" src` → لا اعتماد عربي في authz logic.
- [x] `npx tsc --noEmit` passed.
- [x] `npm run build` passed.

#### Readiness Note
- [x] شرط الجاهزية بعد Task 2.3 محقق: سياسات `role='admin'` أصبحت آمنة بعد PR2.

#### Linked Docs
- `docs/db/RLS_CONTRACT_V1.md`
- `docs/analysis/EXECUTION_PR_PLAN.md`
- `docs/analysis/ROLE_ENUM_MISMATCH_AUDIT.md`
- `docs/runbooks/actionable-tasks-v2.md`

## Deferred Epics

### Rate Limiter
- Deferred as a separate Epic in this branch because `middleware.ts` / `rateLimit.ts` are not present.
