import { Router } from "express";
import { getAllCases } from "./controllers/getall.case.js";
import { getCaseById } from "./controllers/get.caseById.js";
import { createCase } from "./controllers/create.case.js";
import { getSimilarCases } from "./controllers/similar.case.js";
import { updateCase } from "./controllers/update.case.js";
import { engineerAssignCase } from "../assignments/engineer/controllers/engineer.assignCase.js";
import { transitionCase } from "./controllers/transition.case.js";
import { softDeleteCase } from "./controllers/softDelete.case.js";
import { restoreCase } from "./controllers/restore.case.js";
import { developerDeleteCase } from "./controllers/developerDelete.case.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import {
  isBranchAdmin,
  isBranchAdminOrCoordinator,
  isSuperAdmin,
} from "../../middlewares/authorize.js";
import { isHardDeleteAllowed } from "../../middlewares/isHardDeleteAllowed.js";

const router = Router();

router.get("/all-case", isAuthenticated, getAllCases);
router.get("/:id", isAuthenticated, getCaseById);

router.post(
  "/similar",
  isAuthenticated,
  isBranchAdminOrCoordinator,
  getSimilarCases,
);

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
router.patch(
  "/assign/:id",
  isAuthenticated,
  isBranchAdminOrCoordinator,
  engineerAssignCase,
);

router.patch("/status/:id", isAuthenticated, transitionCase);

router.delete(
  "/soft-delete/:id",
  isAuthenticated,
  isBranchAdmin,
  softDeleteCase,
);
router.patch("/restore/:id", isAuthenticated, isBranchAdmin, restoreCase);

router.delete(
  "/developer-delete/:id",
  isAuthenticated,
  isHardDeleteAllowed,
  isSuperAdmin,
  developerDeleteCase,
);

export default router;
