import { Router } from "express";
import { getAllDepartments } from "./controllers/getall.department.js";
import { getDepartmentById } from "./controllers/get.departmentById.js";
import { createDepartment } from "./controllers/create.department.js";
import { updateDepartment } from "./controllers/update.department.js";
import { deleteDepartment } from "./controllers/delete.department.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isBranchAdmin } from "../../middlewares/authorize.js";


const router = Router();


router.get("/all-department",isAuthenticated, isBranchAdmin, getAllDepartments);
router.get("/:id", isAuthenticated, isBranchAdmin, getDepartmentById);
router.post("/create-department", isAuthenticated, isBranchAdmin, createDepartment);
router.put("/update/:id", isAuthenticated, isBranchAdmin, updateDepartment);
router.delete("/delete/:id", isAuthenticated, isBranchAdmin, deleteDepartment);

export default router;
