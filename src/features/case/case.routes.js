import { Router } from "express";
import { getAllCases } from "./controllers/getall.case.js";
import { getCaseById } from "./controllers/get.caseById.js";
import { createCase } from "./controllers/create.case.js";
import { getSimilarCases } from "./controllers/similar.case.js";
import { updateCase } from "./controllers/update.case.js";
import { assignCase } from "./controllers/assign.case.js";
import { transitionCase } from "./controllers/transition.case.js";
import { softDeleteCase } from "./controllers/softDelete.case.js";
import { restoreCase } from "./controllers/restore.case.js";
import { developerDeleteCase } from "./controllers/developerDelete.case.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import {
  isBranchAdmin,
  isBranchAdminOrCoordinator,
} from "../../middlewares/authorize.js";

const router = Router();

router.get("/all-case", isAuthenticated, getAllCases);
router.get("/:id", isAuthenticated, getCaseById);

// Read-only, but a POST: the address it searches on is a seven-field object,
// which does not belong in a query string. The "/:id" route above is a GET, so
// there is nothing for this literal path to be shadowed by.
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
  assignCase,
);

router.patch("/status/:id", isAuthenticated, transitionCase);

router.delete(
  "/soft-delete/:id",
  isAuthenticated,
  isBranchAdmin,
  softDeleteCase,
);
router.patch("/restore/:id", isAuthenticated, isBranchAdmin, restoreCase);

// Development only — unauthenticated hard delete, see the controller.
router.delete("/developer-delete/:id", developerDeleteCase);

export default router;
