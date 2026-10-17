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
import { isSuperAdmin } from "../../middlewares/authorize.js";
import { isHardDeleteAllowed } from "../../middlewares/isHardDeleteAllowed.js";

const router = Router();

router.get(
  "/all-business-types",
  isAuthenticated,

  getAllBusinessTypes,
);

router.get("/:id", isAuthenticated, getBusinessTypeById);

router.post(
  "/create-business-type",
  isAuthenticated,
  isSuperAdmin,
  createBusinessType,
);
router.put("/update/:id", isAuthenticated, isSuperAdmin, updateBusinessType);

router.delete(
  "/soft-delete/:id",
  isAuthenticated,
  isSuperAdmin,
  softDeleteBusinessType,
);

router.patch(
  "/status/:id",
  isAuthenticated,
  isSuperAdmin,
  updateBusinessTypeStatus,
);
router.patch(
  "/restore/:id",
  isAuthenticated,
  isSuperAdmin,
  restoreBusinessType,
);

router.delete(
  "/delete/:id",
  isAuthenticated,
  isHardDeleteAllowed,
  isSuperAdmin,
  deleteBusinessType,
);

export default router;
