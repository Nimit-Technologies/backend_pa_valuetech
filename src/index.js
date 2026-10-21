import { Router } from "express";
import authRoutes from "./features/auth/auth.routes.js";
import addressRoutes from "./features/address/address.routes.js";
import branchRoutes from "./features/branch/branch.routes.js";
import departmentRoutes from "./features/departments/departments.routes.js";
import roleRoutes from "./features/roles/roles.routes.js";
import userRoutes from "./features/users/user.routes.js";
import bankRoutes from "./features/banks/banks.routes.js";
import caseRoutes from "./features/case/case.routes.js";
import dashboardRoutes from "./features/dashboard/dashboard.routes.js";
import businessRoutes from "./features/business_type/business-type.routes.js";
import statusRoutes from "./features/status/status.routes.js";
import remarkRoutes from "./features/remark/remark.routes.js";
import engineerRoutes from "./features/engineer/engineer.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/address", addressRoutes);
router.use("/branch", branchRoutes);
router.use("/department", departmentRoutes);
router.use("/role", roleRoutes);
router.use("/user", userRoutes);
router.use("/bank", bankRoutes);
router.use("/case", caseRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/business", businessRoutes);
router.use("/status", statusRoutes);
router.use("/remark", remarkRoutes);
router.use("/engineer", engineerRoutes);

export default router;
