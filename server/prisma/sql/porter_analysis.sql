-- ─────────────────────────────────────────────────────────────
-- Porter's Five Forces — جدول أداة تحليل قوى بورتر (إضافي فقط: لا تعديل على جداول قائمة)
-- مولَّد بـ: prisma migrate diff (من قاعدة البيانات الحالية إلى schema.prisma)
-- التشغيل اليدوي على Neon:  psql "$DIRECT_URL" -f prisma/sql/porter_analysis.sql
-- أو بديلاً: npx prisma db push (من مجلد server)
-- ─────────────────────────────────────────────────────────────
BEGIN;

-- CreateEnum
CREATE TYPE "porter_status" AS ENUM ('draft', 'completed');

-- CreateEnum
CREATE TYPE "porter_creation_mode" AS ENUM ('manual', 'ai', 'hybrid');

-- CreateTable
CREATE TABLE "porter_analyses" (
    "id" UUID NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "department_id" TEXT,
    "tool_run_id" TEXT,
    "created_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "project_name" TEXT,
    "project_description" TEXT,
    "industry" TEXT,
    "country_region" TEXT,
    "new_entrants" JSONB NOT NULL DEFAULT '{}',
    "buyers" JSONB NOT NULL DEFAULT '{}',
    "suppliers" JSONB NOT NULL DEFAULT '{}',
    "substitutes" JSONB NOT NULL DEFAULT '{}',
    "rivalry" JSONB NOT NULL DEFAULT '{}',
    "status" "porter_status" NOT NULL DEFAULT 'draft',
    "creation_mode" "porter_creation_mode" NOT NULL DEFAULT 'manual',
    "language" TEXT NOT NULL DEFAULT 'ar',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "porter_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "porter_analyses_tool_run_id_key" ON "porter_analyses"("tool_run_id");

-- CreateIndex
CREATE INDEX "porter_analyses_workspace_id_updated_at_idx" ON "porter_analyses"("workspace_id", "updated_at");

-- CreateIndex
CREATE INDEX "porter_analyses_created_by_idx" ON "porter_analyses"("created_by");

-- CreateIndex
CREATE INDEX "porter_analyses_department_id_idx" ON "porter_analyses"("department_id");

-- AddForeignKey
ALTER TABLE "porter_analyses" ADD CONSTRAINT "porter_analyses_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "porter_analyses" ADD CONSTRAINT "porter_analyses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "porter_analyses" ADD CONSTRAINT "porter_analyses_tool_run_id_fkey" FOREIGN KEY ("tool_run_id") REFERENCES "tool_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "porter_analyses" ADD CONSTRAINT "porter_analyses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
