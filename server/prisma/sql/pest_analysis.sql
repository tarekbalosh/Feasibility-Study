-- ─────────────────────────────────────────────────────────────
-- PEST Analysis — جداول أداة تحليل PEST (إضافية فقط: لا تعديل على جداول قائمة)
-- مولَّد بـ: prisma migrate diff (من schema.prisma السابق إلى الحالي)
-- التشغيل اليدوي على Neon:  psql "$DIRECT_URL" -f prisma/sql/pest_analysis.sql
-- أو بديلاً: npx prisma db push (من مجلد server)
-- ─────────────────────────────────────────────────────────────
BEGIN;

-- CreateEnum
CREATE TYPE "pest_dimension" AS ENUM ('political', 'economic', 'social', 'technological', 'legal');

-- CreateEnum
CREATE TYPE "pest_category" AS ENUM ('trend', 'positive_impact', 'negative_impact');

-- CreateEnum
CREATE TYPE "pest_factor_source" AS ENUM ('manual', 'ai', 'ai_edited');

-- CreateEnum
CREATE TYPE "pest_creation_mode" AS ENUM ('manual', 'ai', 'hybrid');

-- CreateEnum
CREATE TYPE "pest_status" AS ENUM ('draft', 'completed');

-- CreateEnum
CREATE TYPE "pest_generation_scope" AS ENUM ('full', 'dimension', 'category');

-- CreateTable
CREATE TABLE "pest_analyses" (
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
    "status" "pest_status" NOT NULL DEFAULT 'draft',
    "creation_mode" "pest_creation_mode" NOT NULL DEFAULT 'manual',
    "language" TEXT NOT NULL DEFAULT 'ar',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pest_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pest_factors" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "dimension" "pest_dimension" NOT NULL,
    "category" "pest_category" NOT NULL,
    "content" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "source" "pest_factor_source" NOT NULL DEFAULT 'manual',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pest_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pest_generation_logs" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "scope" "pest_generation_scope" NOT NULL,
    "dimension" "pest_dimension",
    "category" "pest_category",
    "strategy" TEXT NOT NULL DEFAULT 'replace',
    "model" TEXT,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "items_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pest_generation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pest_analyses_tool_run_id_key" ON "pest_analyses"("tool_run_id");

-- CreateIndex
CREATE INDEX "pest_analyses_workspace_id_updated_at_idx" ON "pest_analyses"("workspace_id", "updated_at");

-- CreateIndex
CREATE INDEX "pest_analyses_created_by_idx" ON "pest_analyses"("created_by");

-- CreateIndex
CREATE INDEX "pest_analyses_department_id_idx" ON "pest_analyses"("department_id");

-- CreateIndex
CREATE INDEX "pest_factors_analysis_id_dimension_category_sort_order_idx" ON "pest_factors"("analysis_id", "dimension", "category", "sort_order");

-- CreateIndex
CREATE INDEX "pest_generation_logs_analysis_id_idx" ON "pest_generation_logs"("analysis_id");

-- CreateIndex
CREATE INDEX "pest_generation_logs_user_id_created_at_idx" ON "pest_generation_logs"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "pest_analyses" ADD CONSTRAINT "pest_analyses_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pest_analyses" ADD CONSTRAINT "pest_analyses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pest_analyses" ADD CONSTRAINT "pest_analyses_tool_run_id_fkey" FOREIGN KEY ("tool_run_id") REFERENCES "tool_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pest_analyses" ADD CONSTRAINT "pest_analyses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pest_factors" ADD CONSTRAINT "pest_factors_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "pest_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pest_factors" ADD CONSTRAINT "pest_factors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pest_generation_logs" ADD CONSTRAINT "pest_generation_logs_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "pest_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pest_generation_logs" ADD CONSTRAINT "pest_generation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
