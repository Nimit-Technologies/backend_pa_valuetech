import { Router } from "express";
import { getSuperAdminDashboard } from "./superAdmin.controller.js";
import { getBranchAdminDashboard } from "./branchAdmin.controller.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isSuperAdmin, isBranchAdmin } from "../../middlewares/authorize.js";

const router = Router();

router.get(
  "/super-admin",
  isAuthenticated,
  isSuperAdmin,
  getSuperAdminDashboard,
);

router.get(
  "/branch-admin",
  isAuthenticated,
  isBranchAdmin,
  getBranchAdminDashboard,
);

export default router;
