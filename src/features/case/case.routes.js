import { Router } from "express";
import { getAllCases } from "./controllers/getall.case.js";
import { getCaseById } from "./controllers/get.caseById.js";
import { createCase } from "./controllers/create.case.js";
import { updateCase } from "./controllers/update.case.js";
import { deleteCase } from "./controllers/delete.case.js";
import { softDeleteCase } from "./controllers/softDelete.case.js";
import { updateCaseStatus } from "./controllers/update-status.case.js";
import { restoreCase } from "./controllers/restore.case.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import {
  isBranchAdmin,
  isBranchAdminOrCoordinator,
} from "../../middlewares/authorize.js";

const router = Router();

router.get(
  "/all-case",
  isAuthenticated,
  isBranchAdminOrCoordinator,
  getAllCases,
);
router.get("/:id", isAuthenticated, isBranchAdminOrCoordinator, getCaseById);
router.post(
  "/create-case",
  isAuthenticated,
  isBranchAdminOrCoordinator,
  createCase,
);
router.put(
  "/update/:id",
  isAuthenticated,
  isBranchAdminOrCoordinator,
  updateCase,
);
router.delete(
  "/soft-delete/:id",
  isAuthenticated,
  isBranchAdmin,
  softDeleteCase,
);
router.patch("/status/:id", isAuthenticated, isBranchAdmin, updateCaseStatus);
router.patch("/restore/:id", isAuthenticated, isBranchAdmin, restoreCase);
router.delete("/delete/:id", isAuthenticated, isBranchAdmin, deleteCase);

export default router;
