# Gamasa Supabase Guide

## الهيكل المعتمد

```text
supabase/
├── README.md
├── manual/
│   ├── MASTER_SCHEMA.sql
│   └── functions.sql
└── migrations/
    ├── 001_base_schema.sql
    ├── 002_bookings_alignment.sql
    ├── 003_normalize_feature_ids.sql
    ├── 004_split_property_location.sql
    ├── 005_storage_bucket.sql
    ├── 006_user_data_fetch.sql
    ├── 007_booking_availability_consistency.sql
    └── 008_booking_storage_hardening.sql
```

## معنى كل ملف

- `supabase/migrations/`
  المصدر الرسمي للتغييرات التراكمية على قاعدة البيانات.
- `supabase/migrations/001_base_schema.sql`
  baseline داخل تاريخ المايغريشن فقط. ليس ملف رفع يدوي لمشروع قائم.
- `supabase/manual/MASTER_SCHEMA.sql`
  snapshot كامل لمشروع جديد من الصفر عبر Supabase Dashboard.
- `supabase/manual/functions.sql`
  hotfix يدوي للدوال والتريجرات فقط.

## المصدر الرسمي للحقيقة

- للمشروع القائم: الحقيقة الرسمية هي `migrations/`.
- للمشروع الجديد اليدوي عبر Dashboard: الحقيقة العملية هي `manual/MASTER_SCHEMA.sql`.
- `manual/functions.sql` ليس بديلًا عن migrations، ولا بديلًا عن `MASTER_SCHEMA.sql`.

## ماذا أرفع إلى Supabase؟

### 1. مشروع جديد من الصفر

- شغّل `supabase/manual/MASTER_SCHEMA.sql` مرة واحدة فقط في `SQL Editor`.
- لا تشغّل بعده `001` إلى `008` يدويًا فوقه.

### 2. مشروع قائم بالفعل

- شغّل فقط الـmigration المطلوبة من `supabase/migrations/`.
- في الحالة الحالية، ملف الرفع الرئيسي لتغييرات hardening هو:
  `supabase/migrations/008_booking_storage_hardening.sql`
- إذا كان المشروع متأخرًا عن أكثر من migration، شغّل الملفات الناقصة بالترتيب الرقمي.

### 3. تعديل دوال فقط

- شغّل `supabase/manual/functions.sql` فقط إذا كان التعديل محصورًا في:
  `FUNCTION`, `TRIGGER`, أو `GRANT/REVOKE` المرتبط بها.
- لا تستخدمه إذا كان التغيير يشمل:
  `ALTER TABLE`, `CREATE POLICY`, `INSERT INTO storage.buckets`, أو أي تغيير schema.

## لا تشغّل هذه الملفات في هذه الحالات

- لا تشغّل `supabase/manual/MASTER_SCHEMA.sql` على مشروع قائم.
- لا تشغّل `supabase/migrations/001_base_schema.sql` يدويًا على مشروع قائم.
- لا تشغّل `supabase/manual/functions.sql` لتطبيق تغييرات storage أو RLS أو schema.

## الملفات الأهم حاليًا

- `supabase/migrations/005_storage_bucket.sql`
  بداية bucket setup القديم لصور العقارات.
- `supabase/migrations/007_booking_availability_consistency.sql`
  تحسينات سابقة على التحقق من توافر الحجز.
- `supabase/migrations/008_booking_storage_hardening.sql`
  التغييرات الحالية الأهم:
  hardening للحجوزات، RPC flows، private storage، وسياسات القراءة/الرفع الجديدة.

## Run This / Do Not Run This

| الحالة | شغّل | لا تشغّل |
|---|---|---|
| مشروع جديد عبر Dashboard | `supabase/manual/MASTER_SCHEMA.sql` | `001` إلى `008` يدويًا فوقه |
| مشروع قائم | الـmigration المطلوبة فقط | `manual/MASTER_SCHEMA.sql` |
| hotfix دوال فقط | `supabase/manual/functions.sql` | أي migration فيها schema أو policies |

## ملاحظات تنظيمية

- لا نضيف تغييرات جديدة داخل `001_base_schema.sql` بعد الآن.
- أي تعديل جديد على المشروع القائم يدخل كـ migration جديدة فقط.
- إذا احتجت snapshot يدوي جديد، حدّث ملفات `manual/` من الحالة النهائية الحالية بدل تعديل `001`.
