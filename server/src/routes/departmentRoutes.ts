import { Router } from "express";
import { body, param } from "express-validator";
import * as departmentController from "../controllers/departmentController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireWorkspace } from "../middleware/workspaceMiddleware";
import { attachActor } from "../middleware/actorMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import { DEPARTMENT_COLORS, DEPARTMENT_ICONS } from "../services/departmentService";

const router = Router();

router.use(authMiddleware);
router.use(requireWorkspace);
router.use(attachActor);

router.get("/", departmentController.list);

router.get(
  "/:id",
  validateRequest([param("id").isUUID().withMessage("معرّف القسم غير صالح.")]),
  departmentController.getOne
);

router.post(
  "/",
  validateRequest([
    body("name").trim().isLength({ min: 1, max: 80 }).withMessage("اسم القسم مطلوب (حتى 80 حرف)."),
    body("description").optional({ values: "falsy" }).isLength({ max: 500 }),
    body("color").optional({ values: "falsy" }).isIn(DEPARTMENT_COLORS),
    body("icon").optional({ values: "falsy" }).isIn(DEPARTMENT_ICONS),
    body("members").optional().isArray(),
    body("members.*.memberId").optional().isString(),
    body("members.*.role").optional().isIn(["head", "member"]),
  ]),
  departmentController.create
);

router.put(
  "/:id",
  validateRequest([
    param("id").isUUID().withMessage("معرّف القسم غير صالح."),
    body("name").optional().trim().isLength({ min: 1, max: 80 }),
    body("description").optional({ values: "null" }).isLength({ max: 500 }),
    body("color").optional({ values: "falsy" }).isIn(DEPARTMENT_COLORS),
    body("icon").optional({ values: "falsy" }).isIn(DEPARTMENT_ICONS),
    body("members").optional().isArray(),
  ]),
  departmentController.update
);

router.delete(
  "/:id",
  validateRequest([param("id").isUUID().withMessage("معرّف القسم غير صالح.")]),
  departmentController.remove
);

export default router;
