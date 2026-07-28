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
import { isAdmin } from "../../middlewares/authorize.js";

const router = Router();

router.get("/all-bank", isAuthenticated, isAdmin, getAllBanks);
router.get("/:id", isAuthenticated, isAdmin, getBankById);
router.post("/create-bank", isAuthenticated, isAdmin, createBank);
router.put("/update/:id", isAuthenticated, isAdmin, updateBank);
router.delete("/soft-delete/:id", isAuthenticated, isAdmin, softDeleteBank);
router.patch("/status/:id", isAuthenticated, isAdmin, updateBankStatus);
router.patch("/restore/:id", isAuthenticated, isAdmin, restoreBank);
router.delete("/delete/:id", isAuthenticated, isAdmin, deleteBank);

export default router;
