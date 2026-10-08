import { Router } from "express";
import * as orgController from "../controllers/orgController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireWorkspace } from "../middleware/workspaceMiddleware";
import { attachActor } from "../middleware/actorMiddleware";

const router = Router();

router.use(authMiddleware);
router.use(requireWorkspace);
router.use(attachActor);

router.get("/context", orgController.getMyContext);
router.get("/members", orgController.listMembers);
router.get("/overview", orgController.getOverview);

export default router;
