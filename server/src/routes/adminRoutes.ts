import { Router } from "express";
import { adminMiddleware } from "../middleware/adminMiddleware";
import * as adminController from "../controllers/adminController";

const router = Router();

// تطبيق طبقات الحماية على جميع مسارات الإدارة (بواسطة السر الخاص)
router.use(adminMiddleware);

// الإحصائيات العامة
router.get("/overview", adminController.getOverview);

// إدارة المستخدمين
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/status", adminController.updateUserStatus);

// إدارة مساحات العمل
router.get("/workspaces", adminController.getWorkspaces);
router.get("/workspaces/:id", adminController.getWorkspaceById);

// إدارة المشاريع
router.get("/projects", adminController.getProjects);

// إدارة الأدوات والنتائج
router.get("/tools", adminController.getTools);
router.get("/tool-runs", adminController.getToolRuns);

// إدارة المدفوعات
router.get("/payments", adminController.getPayments);

// إدارة حدود الاستخدام
router.get("/limits", adminController.getLimits);
router.patch("/limits/:userId", adminController.updateUserLimit);

// سجلات النظام (Audit Logs)
router.get("/logs", adminController.getAuditLogs);

export default router;
