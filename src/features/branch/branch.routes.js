import { Router } from "express";
import { getAllBranches } from "./controllers/getall.branch.js";
import { getBranchById } from "./controllers/get.branchById.js";
import { createBranch } from "./controllers/create.branch.js";
import { updateBranch } from "./controllers/update.branch.js";
import { deleteBranch } from "./controllers/delete.branch.js";

const router = Router();

router.get("/all-branch", getAllBranches);
router.get("/:id", getBranchById);
router.post("/create-branch", createBranch);
router.put("/update/:id", updateBranch);
router.delete("/delete/:id", deleteBranch);

export default router;
