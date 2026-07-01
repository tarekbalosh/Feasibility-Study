import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import projectRoutes from "./projectRoutes";
import reportRoutes from "./reportRoutes";
import feasibilityRoutes from "./feasibilityRoutes";
import systemRoutes from "./systemRoutes";

const router = Router();

// Mount sub-routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/reports", reportRoutes);
router.use("/feasibility", feasibilityRoutes);
router.use(systemRoutes);
// Health check
router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
