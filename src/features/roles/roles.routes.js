import { Router } from "express";
import { getAllRoles } from "./controllers/getall.role.js";
import { getRoleById } from "./controllers/get.roleById.js";
import { createRole } from "./controllers/create.role.js";
import { updateRole } from "./controllers/update.role.js";
import { deleteRole } from "./controllers/delete.role.js";
import { softDeleteRole } from "./controllers/softDelete.role.js";
import { updateRoleStatus } from "./controllers/update-status.role.js";
import { restoreRole } from "./controllers/restore.role.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isSuperAdmin, isAdmin } from "../../middlewares/authorize.js";

const router = Router();

router.get("/all-role", isAuthenticated, isAdmin, getAllRoles);
router.get("/:id", isAuthenticated, isSuperAdmin, getRoleById);
router.post("/create-role", isAuthenticated, isSuperAdmin, createRole);
router.put("/update/:id", isAuthenticated, isSuperAdmin, updateRole);
router.delete(
  "/soft-delete/:id",
  isAuthenticated,
  isSuperAdmin,
  softDeleteRole,
);
router.patch("/status/:id", isAuthenticated, isSuperAdmin, updateRoleStatus);
router.patch("/restore/:id", isAuthenticated, isSuperAdmin, restoreRole);
router.delete("/delete/:id", isAuthenticated, isSuperAdmin, deleteRole);

export default router;
