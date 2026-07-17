import { Router } from "express";
import authRoutes from "./features/auth/auth.routes.js";
import addressRoutes from "./features/address/address.routes.js";
import branchRoutes from "./features/branch/branch.routes.js";
import departmentRoutes from "./features/departments/departments.routes.js";
import roleRoutes from "./features/roles/roles.routes.js";
import userRoutes from "./features/users/user.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/address", addressRoutes);
router.use("/branch", branchRoutes);
router.use("/department", departmentRoutes);
router.use("/role", roleRoutes);
router.use("/user", userRoutes);

export default router;
