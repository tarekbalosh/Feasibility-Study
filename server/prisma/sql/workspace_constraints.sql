-- ─────────────────────────────────────────────────────────────
--  قيود CHECK لجداول مساحات العمل
-- ─────────────────────────────────────────────────────────────
--  Prisma لا يعبّر عن CHECK في schema.prisma، فتُطبَّق هنا يدوياً.
--  السكربت idempotent — يمكن تشغيله مرّات دون خطأ:
--    psql "$DIRECT_URL" -f prisma/sql/workspace_constraints.sql
--  شغّله بعد `prisma db push` (أي بعد إنشاء الجداول).
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspace_members_role_check'
  ) THEN
    ALTER TABLE "workspace_members"
      ADD CONSTRAINT "workspace_members_role_check"
      CHECK ("role" IN ('owner', 'admin', 'member', 'viewer'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspace_members_status_check'
  ) THEN
    ALTER TABLE "workspace_members"
      ADD CONSTRAINT "workspace_members_status_check"
      CHECK ("status" IN ('active', 'invited', 'pending'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspace_invites_role_check'
  ) THEN
    ALTER TABLE "workspace_invites"
      ADD CONSTRAINT "workspace_invites_role_check"
      CHECK ("role" IN ('admin', 'member', 'viewer'));
  END IF;
END
$$;
