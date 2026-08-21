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
import { isAdmin } from "../../middlewares/authorize.js";

const router = Router();

router.get(
  "/all-business-types",
  isAuthenticated,
  isAdmin,
  getAllBusinessTypes,
);

router.get("/:id", isAuthenticated, isAdmin, getBusinessTypeById);

router.post(
  "/create-business-type",
  isAuthenticated,
  isAdmin,
  createBusinessType,
);
router.put("/update/:id", isAuthenticated, isAdmin, updateBusinessType);

router.delete(
  "/soft-delete/:id",
  isAuthenticated,
  isAdmin,
  softDeleteBusinessType,
);

router.patch("/status/:id", isAuthenticated, isAdmin, updateBusinessTypeStatus);
router.patch("/restore/:id", isAuthenticated, isAdmin, restoreBusinessType);

router.delete("/delete/:id", isAuthenticated, isAdmin, deleteBusinessType);

export default router;
