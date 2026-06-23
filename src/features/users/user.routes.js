import { Router } from "express";
import { getAllUsers } from "./controllers/getall.user.js";
import { getUserById } from "./controllers/get.userById.js";
import { createUser } from "./controllers/create.user.js";
import { updateUser } from "./controllers/update.user.js";
import { deleteUser } from "./controllers/delete.user.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isBranchAdmin } from "../../middlewares/authorize.js";


const router = Router();


router.get("/all-user", isAuthenticated, isBranchAdmin, getAllUsers);
router.get("/:id", isAuthenticated, isBranchAdmin, getUserById);
router.post("/create-user", isAuthenticated, isBranchAdmin, createUser);
router.put("/update/:id", isAuthenticated, isBranchAdmin, updateUser);
router.delete("/delete/:id", isAuthenticated, isBranchAdmin, deleteUser);

export default router;
