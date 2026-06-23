import { Router } from "express";
import { getAllUsers }  from "./controllers/getall.user.js";
import { getUserById } from "./controllers/get.userById.js";
import { createUser }  from "./controllers/create.user.js";
import { updateUser }  from "./controllers/update.user.js";
import { deleteUser }  from "./controllers/delete.user.js";


const router = Router();


router.get("/all-user", getAllUsers);
router.get("/:id",      getUserById);
router.post("/create-user",  createUser);
router.put("/update/:id",    updateUser);
router.delete("/delete/:id", deleteUser);

export default router;
