import { Router } from "express";
import {
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
} from "./roles.controller.js";

const router = Router();

router.get("/all-role", getAllRoles);
router.get("/:id", getRoleById);
router.post("/create-role", createRole);
router.put("/update/:id", updateRole);
router.delete("/delete/:id", deleteRole);

export default router;
