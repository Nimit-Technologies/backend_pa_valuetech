import { Router } from "express";
import { getAllBusinessTypes } from "./controllers/getall.business-type.js";
import { getBusinessTypeById } from "./controllers/get.business-typeById.js";
import { createBusinessType } from "./controllers/create.business-type.js";
import { updateBusinessType } from "./controllers/update.business-type.js";
import { deleteBusinessType } from "./controllers/delete.business-type.js";
import { softDeleteBusinessType } from "./controllers/softDelete.business-type.js";
import { updateBusinessTypeStatus } from "./controllers/update-status.business-type.js";
import { restoreBusinessType } from "./controllers/restore.business-type.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import {
  isBranchAdminOrCoordinator,
  isBranchAdmin,
} from "../../middlewares/authorize.js";

const router = Router();

router.get(
  "/all-business-types",
  isAuthenticated,
  isBranchAdminOrCoordinator,
  getAllBusinessTypes,
);

router.get("/:id", isAuthenticated, isBranchAdmin, getBusinessTypeById);

router.post(
  "/create-business-type",
  isAuthenticated,
  isBranchAdmin,
  createBusinessType,
);
router.put("/update/:id", isAuthenticated, isBranchAdmin, updateBusinessType);

router.delete(
  "/soft-delete/:id",
  isAuthenticated,
  isBranchAdmin,
  softDeleteBusinessType,
);

router.patch(
  "/status/:id",
  isAuthenticated,
  isBranchAdmin,
  updateBusinessTypeStatus,
);
router.patch(
  "/restore/:id",
  isAuthenticated,
  isBranchAdmin,
  restoreBusinessType,
);

router.delete(
  "/delete/:id",
  isAuthenticated,
  isBranchAdmin,
  deleteBusinessType,
);

export default router;
