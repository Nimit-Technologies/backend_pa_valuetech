import { Router } from "express";
import { getAllRoles } from "./controllers/getall.role.js";
import { getRoleById } from "./controllers/get.roleById.js";
import { createRole }  from "./controllers/create.role.js";
import { updateRole }  from "./controllers/update.role.js";
import { deleteRole }  from "./controllers/delete.role.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isAdmin } from "../../middlewares/authorize.js";


const router = Router();


router.get("/all-role",isAuthenticated, isAdmin, getAllRoles);
router.get("/:id", isAuthenticated, isAdmin, getRoleById);
router.post("/create-role", isAuthenticated, isAdmin, createRole);
router.put("/update/:id", isAuthenticated, isAdmin, updateRole);
router.delete("/delete/:id", isAuthenticated, isAdmin, deleteRole);

export default router;
