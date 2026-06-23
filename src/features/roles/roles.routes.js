import { Router } from "express";
import { getAllRoles } from "./controllers/getall.role.js";
import { getRoleById } from "./controllers/get.roleById.js";
import { createRole }  from "./controllers/create.role.js";
import { updateRole }  from "./controllers/update.role.js";
import { deleteRole }  from "./controllers/delete.role.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isBranchAdmin } from "../../middlewares/authorize.js";


const router = Router();


router.get("/all-role",isAuthenticated, isBranchAdmin, getAllRoles);
router.get("/:id", isAuthenticated, isBranchAdmin, getRoleById);
router.post("/create-role", isAuthenticated, isBranchAdmin, createRole);
router.put("/update/:id", isAuthenticated, isBranchAdmin, updateRole);
router.delete("/delete/:id", isAuthenticated, isBranchAdmin, deleteRole);

export default router;
