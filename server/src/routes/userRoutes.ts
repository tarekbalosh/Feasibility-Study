import { Router } from "express";
import { body } from "express-validator";
import * as userController from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// ——— GET /api/users/me ———
router.get("/me", userController.getMe);

// ——— PUT /api/users/me ———
router.put(
  "/me",
  validateRequest([
    body("name")
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage("الاسم يجب أن يكون بين 3 و 100 حرف."),
    body("email")
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("صيغة البريد الإلكتروني غير صحيحة."),
  ]),
  userController.updateMe
);

// ——— PUT /api/users/change-password ———
router.put(
  "/change-password",
  validateRequest([
    body("currentPassword")
      .notEmpty()
      .withMessage("كلمة المرور الحالية مطلوبة."),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.")
      .matches(/[A-Z]/)
      .withMessage("يجب أن تحتوي على حرف كبير واحد على الأقل.")
      .matches(/[0-9]/)
      .withMessage("يجب أن تحتوي على رقم واحد على الأقل."),
  ]),
  userController.changePassword
);

// ——— DELETE /api/users/me ———
router.delete("/me", userController.deleteMe);

export default router;
