import { Router } from "express";
import { getAllUsers } from "./controllers/getall.user.js";
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
import { isSuperAdmin, isAdmin } from "../../middlewares/authorize.js";
import { passwordResetLimiter } from "../../middlewares/password-reset-limiter.js";

const router = Router();

router.patch("/change-password", isAuthenticated, changePassword);
router.put("/profile", isAuthenticated, updateOwnProfile);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

router.post("/aadhaar", isAuthenticated, getOriginalAadhaar);

router.get("/all-user", isAuthenticated, isAdmin, getAllUsers);
router.get("/:id", isAuthenticated, isAdmin, getUserById);
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
router.delete("/delete/:id", isAuthenticated, isSuperAdmin, deleteUser);

export default router;
