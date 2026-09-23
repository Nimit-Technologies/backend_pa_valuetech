import { Router } from "express";
import { getAllBanks } from "./controllers/getall.bank.js";
import { getBankById } from "./controllers/get.bankById.js";
import { createBank } from "./controllers/create.bank.js";
import { updateBank } from "./controllers/update.bank.js";
import { deleteBank } from "./controllers/delete.bank.js";
import { softDeleteBank } from "./controllers/softDelete.bank.js";
import { updateBankStatus } from "./controllers/update-status.bank.js";
import { restoreBank } from "./controllers/restore.bank.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import {
  isBranchAdmin,
  isBranchAdminOrCoordinator,
} from "../../middlewares/authorize.js";

const router = Router();

router.get(
  "/all-bank",
  isAuthenticated,
  isBranchAdminOrCoordinator,
  getAllBanks,
);
router.get("/:id", isAuthenticated, isBranchAdmin, getBankById);
router.post("/create-bank", isAuthenticated, isBranchAdmin, createBank);
router.put("/update/:id", isAuthenticated, isBranchAdmin, updateBank);
router.delete(
  "/soft-delete/:id",
  isAuthenticated,
  isBranchAdmin,
  softDeleteBank,
);
router.patch("/status/:id", isAuthenticated, isBranchAdmin, updateBankStatus);
router.patch("/restore/:id", isAuthenticated, isBranchAdmin, restoreBank);
router.delete("/delete/:id", isAuthenticated, isBranchAdmin, deleteBank);

export default router;
