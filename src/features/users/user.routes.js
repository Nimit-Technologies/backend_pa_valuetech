import { Router } from "express";
import { getAllUsers } from "./controllers/getall.user.js";
import { getUserById } from "./controllers/get.userById.js";
import { createUser } from "./controllers/create.user.js";
import { updateUser } from "./controllers/update.user.js";
import { deleteUser } from "./controllers/delete.user.js";
import { softDeleteUser } from "./controllers/softDelete.user.js";
import { updateUserStatus } from "./controllers/update-status.user.js";
import { restoreUser } from "./controllers/restore.user.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isAdmin } from "../../middlewares/authorize.js";

const router = Router();

router.get("/all-user", isAuthenticated, isAdmin, getAllUsers);
router.get("/:id", isAuthenticated, isAdmin, getUserById);
router.post("/create-user", isAuthenticated, isAdmin, createUser);
router.put("/update/:id", isAuthenticated, isAdmin, updateUser);
router.delete("/soft-delete/:id", isAuthenticated, isAdmin, softDeleteUser);
router.patch("/status/:id", isAuthenticated, isAdmin, updateUserStatus);
router.patch("/restore/:id", isAuthenticated, isAdmin, restoreUser);
router.delete("/delete/:id", isAuthenticated, isAdmin, deleteUser);

export default router;
