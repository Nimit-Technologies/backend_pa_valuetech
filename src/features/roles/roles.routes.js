import { Router } from "express";
import { getAllRoles } from "./controllers/getall.role.js";
import { getRoleById } from "./controllers/get.roleById.js";
import { createRole }  from "./controllers/create.role.js";
import { updateRole }  from "./controllers/update.role.js";
import { deleteRole }  from "./controllers/delete.role.js";


const router = Router();


router.get("/all-role", getAllRoles);
router.get("/:id",      getRoleById);
router.post("/create-role", createRole);
router.put("/update/:id",   updateRole);
router.delete("/delete/:id",deleteRole);

export default router;
