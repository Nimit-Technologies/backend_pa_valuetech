import { Router } from "express";
import { getAllAddresses } from "./controllers/getall.address.js";
import { getAddressById } from "./controllers/get.addressById.js";
import { createAddress }  from "./controllers/create.address.js";
import { updateAddress }  from "./controllers/update.address.js";
import { deleteAddress }  from "./controllers/delete.address.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isAdmin } from "../../middlewares/authorize.js";


const router = Router();


router.get("/all-address", isAuthenticated, isAdmin, getAllAddresses);
router.get("/:id",         isAuthenticated, isAdmin, getAddressById);
router.post("/create-address",  isAuthenticated, isAdmin, createAddress);
router.put("/update/:id",       isAuthenticated, isAdmin, updateAddress);
router.delete("/delete/:id",    isAuthenticated, isAdmin, deleteAddress);

export default router;
