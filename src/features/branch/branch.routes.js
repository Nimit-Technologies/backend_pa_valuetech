import { Router } from "express";
import { getAllBranches } from "./controllers/getall.branch.js";
import { getBranchById } from "./controllers/get.branchById.js";
import { createBranch } from "./controllers/create.branch.js";
import { updateBranch } from "./controllers/update.branch.js";
import { deleteBranch } from "./controllers/delete.branch.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isSuperAdmin } from "../../middlewares/authorize.js";


const router = Router();


router.get("/all-branch", isAuthenticated, isSuperAdmin, getAllBranches);
router.get("/:id", isAuthenticated, isSuperAdmin, getBranchById);
router.post("/create-branch", isAuthenticated, isSuperAdmin, createBranch);
router.put("/update/:id", isAuthenticated, isSuperAdmin, updateBranch);
router.delete("/delete/:id", isAuthenticated, isSuperAdmin, deleteBranch);

export default router;
