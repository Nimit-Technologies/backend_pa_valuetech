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
  isSuperAdmin,
} from "../../middlewares/authorize.js";
import { isHardDeleteAllowed } from "../../middlewares/isHardDeleteAllowed.js";

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

// Hard delete, kept for local data cleanup. It was previously mounted with no
// middleware at all, which left an unauthenticated route that could erase any
// case by id; it now requires a session and super admin on top of the
// ALLOW_HARD_DELETE opt-in, which is off in production.
router.delete(
  "/developer-delete/:id",
  isAuthenticated,
  isHardDeleteAllowed,
  isSuperAdmin,
  developerDeleteCase,
);

export default router;
