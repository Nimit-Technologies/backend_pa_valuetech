import { Router } from "express";
import { getAllUsers } from "./controllers/getall.user.js";
import { getAllEngineers } from "./controllers/getall.engineer.js";
import { getUserById } from "./controllers/get.userById.js";
import { createUser } from "./controllers/create.user.js";
import { updateUser } from "./controllers/update.user.js";
import { updateOwnProfile } from "./controllers/update-profile.user.js";
import { deleteUser } from "./controllers/delete.user.js";
import { softDeleteUser } from "./controllers/softDelete.user.js";
import { updateUserStatus } from "./controllers/update-status.user.js";
import { restoreUser } from "./controllers/restore.user.js";
import { changePassword } from "./controllers/change-password.user.js";
import { forgotPassword } from "./controllers/forgot-password.user.js";
import { resetPassword } from "./controllers/reset-password.user.js";
import { getOriginalAadhaar } from "./controllers/get-aadhaar.user.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import {
  isSuperAdmin,
  isAdmin,
  isAdminOrSelf,
} from "../../middlewares/authorize.js";
import { passwordResetLimiter } from "../../middlewares/password-reset-limiter.js";
import { isHardDeleteAllowed } from "../../middlewares/isHardDeleteAllowed.js";

const router = Router();

router.patch("/change-password", isAuthenticated, changePassword);
router.put("/profile", isAuthenticated, updateOwnProfile);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

router.post("/aadhaar", isAuthenticated, getOriginalAadhaar);

router.get("/all-user", isAuthenticated, isAdmin, getAllUsers);

router.get("/all-engineer", isAuthenticated, getAllEngineers);

router.get("/:id", isAuthenticated, isAdminOrSelf, getUserById);
router.post("/create-user", isAuthenticated, isSuperAdmin, createUser);
router.put("/update/:id", isAuthenticated, isSuperAdmin, updateUser);
router.delete(
  "/soft-delete/:id",
  isAuthenticated,
  isSuperAdmin,
  softDeleteUser,
);
router.patch("/status/:id", isAuthenticated, isSuperAdmin, updateUserStatus);
router.patch("/restore/:id", isAuthenticated, isSuperAdmin, restoreUser);
router.delete(
  "/delete/:id",
  isAuthenticated,
  isHardDeleteAllowed,
  isSuperAdmin,
  deleteUser,
);

export default router;
