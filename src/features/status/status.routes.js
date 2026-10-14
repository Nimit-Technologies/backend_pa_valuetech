import { Router } from "express";
import { getAllStatuses } from "./controllers/getall.status.js";
import { getStatusById } from "./controllers/get.statusById.js";
import { createStatus } from "./controllers/create.status.js";
import { updateStatus } from "./controllers/update.status.js";
import { deleteStatus } from "./controllers/delete.status.js";
import { softDeleteStatus } from "./controllers/softDelete.status.js";
import { restoreStatus } from "./controllers/restore.status.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isSuperAdmin } from "../../middlewares/authorize.js";

const router = Router();

// Status is a global lookup table — no branch scoping anywhere in this
// feature. Only a super admin may change it; every authenticated role can
// read the list, since statuses populate the workflow dropdowns.
//
// Declared before "/:id" so the literal path is not swallowed by the param.
router.get("/all-status", isAuthenticated, getAllStatuses);

router.get("/:id", isAuthenticated, isSuperAdmin, getStatusById);
router.post("/create-status", isAuthenticated, isSuperAdmin, createStatus);
router.put("/update/:id", isAuthenticated, isSuperAdmin, updateStatus);
router.delete(
  "/soft-delete/:id",
  isAuthenticated,
  isSuperAdmin,
  softDeleteStatus,
);
router.patch("/restore/:id", isAuthenticated, isSuperAdmin, restoreStatus);
router.delete("/delete/:id", isAuthenticated, isSuperAdmin, deleteStatus);

export default router;
