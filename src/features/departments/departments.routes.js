import { Router } from "express";
import {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} from "./departments.controller.js";

const router = Router();

router.get("/all-department", getAllDepartments);
router.get("/:id", getDepartmentById);
router.post("/create-department", createDepartment);
router.put("/update/:id", updateDepartment);
router.delete("/delete/:id", deleteDepartment);

export default router;
