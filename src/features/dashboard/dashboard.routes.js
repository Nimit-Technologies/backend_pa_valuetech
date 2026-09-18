import { Router } from "express";
import { getSuperAdminDashboard } from "./dashboard.controller.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isSuperAdmin } from "../../middlewares/authorize.js";

const router = Router();

router.get(
  "/super-admin",
  isAuthenticated,
  isSuperAdmin,
  getSuperAdminDashboard,
);

export default router;
