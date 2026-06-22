import { Router } from "express";
import { getAllDepartments } from "./controllers/getall.department.js";
import { getDepartmentById } from "./controllers/get.departmentById.js";
import { createDepartment } from "./controllers/create.department.js";
import { updateDepartment } from "./controllers/update.department.js";
import { deleteDepartment } from "./controllers/delete.department.js";

const router = Router();

router.get("/all-department", getAllDepartments);
router.get("/:id", getDepartmentById);
router.post("/create-department", createDepartment);
router.put("/update/:id", updateDepartment);
router.delete("/delete/:id", deleteDepartment);

export default router;
