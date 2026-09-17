import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import projectRoutes from "./projectRoutes";
import reportRoutes from "./reportRoutes";
import feasibilityRoutes from "./feasibilityRoutes";
import systemRoutes from "./systemRoutes";
import workspaceRoutes from "./workspaceRoutes";
import inviteRoutes from "./inviteRoutes";
import toolRunRoutes from "./toolRunRoutes";
import swotGoalsRoutes from "./swotGoalsRoutes";
import adminRoutes from "./adminRoutes";

const router = Router();

// Mount sub-routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/reports", reportRoutes);
router.use("/feasibility", feasibilityRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/invites", inviteRoutes);
router.use("/tool-runs", toolRunRoutes);
router.use("/swot-goals", swotGoalsRoutes);
router.use("/admin", adminRoutes);
router.use('/system', systemRoutes);
// Health check
router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
