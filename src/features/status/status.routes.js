import { Router } from "express";
import { getAllStatuses } from "./controllers/getall.status.js";
import { getStatusById } from "./controllers/get.statusById.js";
import { createStatus } from "./controllers/create.status.js";
import { updateStatus } from "./controllers/update.status.js";
import { deleteStatus } from "./controllers/delete.status.js";
import { softDeleteStatus } from "./controllers/softDelete.status.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isAdmin } from "../../middlewares/authorize.js";

const router = Router();

router.get("/all-status", isAuthenticated, isAdmin, getAllStatuses);
router.get("/:id", isAuthenticated, isAdmin, getStatusById);
router.post("/create-status", isAuthenticated, isAdmin, createStatus);
router.put("/update/:id", isAuthenticated, isAdmin, updateStatus);
router.delete("/soft-delete/:id", isAuthenticated, isAdmin, softDeleteStatus);
router.delete("/delete/:id", isAuthenticated, isAdmin, deleteStatus);

export default router;
