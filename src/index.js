import { Router } from "express";
import authRoutes from "./features/auth/auth.routes.js";
import addressRoutes from "./features/address/address.routes.js";
import branchRoutes from "./features/branch/branch.routes.js";
import departmentRoutes from "./features/departments/departments.routes.js";
import roleRoutes from "./features/roles/roles.routes.js";
import userRoutes from "./features/users/user.routes.js";
import bankRoutes from "./features/banks/banks.routes.js";
import remarkRoutes from "./features/remark/remark.routes.js";
import statusRoutes from "./features/status/status.routes.js";
import businessTypeRoutes from "./features/business_type/business-type.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/branch", branchRoutes);
router.use("/address", addressRoutes);
router.use("/department", departmentRoutes);
router.use("/role", roleRoutes);
router.use("/user", userRoutes);
router.use("/bank", bankRoutes);
router.use("/remark", remarkRoutes);
router.use("/status", statusRoutes);
router.use("/business-type", businessTypeRoutes);

export default router;
