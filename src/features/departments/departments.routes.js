import { Router } from "express";
import { getAllDepartments } from "./controllers/getall.department.js";
import { getDepartmentById } from "./controllers/get.departmentById.js";
import { createDepartment } from "./controllers/create.department.js";
import { updateDepartment } from "./controllers/update.department.js";
import { deleteDepartment } from "./controllers/delete.department.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isAdmin } from "../../middlewares/authorize.js";


const router = Router();


router.get("/all-department",isAuthenticated, isAdmin, getAllDepartments);
router.get("/:id", isAuthenticated, isAdmin, getDepartmentById);
router.post("/create-department", isAuthenticated, isAdmin, createDepartment);
router.put("/update/:id", isAuthenticated, isAdmin, updateDepartment);
router.delete("/delete/:id", isAuthenticated, isAdmin, deleteDepartment);

export default router;
