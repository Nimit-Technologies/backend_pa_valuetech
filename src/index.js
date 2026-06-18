import { Router } from "express";
import departmentRoutes from "./features/departments/departments.routes.js";

const router = Router();

router.use("/department", departmentRoutes);

export default router;
