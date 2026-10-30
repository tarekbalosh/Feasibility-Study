-- ─────────────────────────────────────────────────────────────
-- PEST — ربط كل انعكاس (إيجابي/سلبي) ببند التوجه الأب
-- تعديل إضافي فقط: عمود nullable + مفتاح أجنبي ذاتي + فهرس فريد.
-- لا يحذف ولا يعدّل أي بيانات قائمة؛ البنود القديمة تبقى parent_factor_id = NULL.
-- آمن لإعادة التشغيل (idempotent).
-- التشغيل:  npx prisma db execute --file prisma/sql/pest_implication_links.sql --schema prisma/schema.prisma
--      أو:  psql "$DIRECT_URL" -f prisma/sql/pest_implication_links.sql
-- ─────────────────────────────────────────────────────────────
BEGIN;

ALTER TABLE "pest_factors" ADD COLUMN IF NOT EXISTS "parent_factor_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pest_factors_parent_factor_id_fkey'
  ) THEN
    ALTER TABLE "pest_factors"
      ADD CONSTRAINT "pest_factors_parent_factor_id_fkey"
      FOREIGN KEY ("parent_factor_id") REFERENCES "pest_factors"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- انعكاس إيجابي واحد وسلبي واحد كحد أقصى لكل بند (NULL لا يتعارض مع نفسه)
CREATE UNIQUE INDEX IF NOT EXISTS "pest_factors_parent_factor_id_category_key"
  ON "pest_factors"("parent_factor_id", "category");

COMMIT;
