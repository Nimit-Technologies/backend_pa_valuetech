import { Router } from "express";
import { getAllUsers } from "./controllers/getall.user.js";
import { getUserById } from "./controllers/get.userById.js";
import { createUser } from "./controllers/create.user.js";
import { updateUser } from "./controllers/update.user.js";
import { deleteUser } from "./controllers/delete.user.js";
import { softDeleteUser } from "./controllers/softDelete.user.js";
import { updateUserStatus } from "./controllers/update-status.user.js";
import { restoreUser } from "./controllers/restore.user.js";
import { changePassword } from "./controllers/change-password.user.js";
import { forgotPassword } from "./controllers/forgot-password.user.js";
import { resetPassword } from "./controllers/reset-password.user.js";
import { getOriginalAadhaar } from "./controllers/get-aadhaar.user.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isAdmin } from "../../middlewares/authorize.js";
import { passwordResetLimiter } from "../../middlewares/password-reset-limiter.js";

const router = Router();

// --- Password management ---
// Kept separate from the admin PUT /update/:id path: self-service change
// always requires the current password; forgot/reset are public and
// token-based. Declared before "/:id" so the literal paths win.
// NOTE: /forgot-password and /reset-password need the password_reset_tokens
// table — run `npm run migrate` after pulling this change.
router.patch("/change-password", isAuthenticated, changePassword);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

// --- Aadhaar reveal ---
// The only endpoint that returns an Aadhaar number decrypted in full.
// Admin-only, and every successful reveal is written to the audit log.
// Body: { employee_id: "emp12373" }.
router.post("/aadhaar", isAuthenticated, getOriginalAadhaar);

router.get("/all-user", getAllUsers);
router.get("/:id", isAuthenticated, isAdmin, getUserById);
router.post("/create-user", isAuthenticated, isAdmin, createUser);
router.put("/update/:id", isAuthenticated, isAdmin, updateUser);
router.delete("/soft-delete/:id", isAuthenticated, isAdmin, softDeleteUser);
router.patch("/status/:id", isAuthenticated, isAdmin, updateUserStatus);
router.patch("/restore/:id", isAuthenticated, isAdmin, restoreUser);
router.delete("/delete/:id", isAuthenticated, isAdmin, deleteUser);

export default router;
