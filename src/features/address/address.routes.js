import { Router } from "express";
import { getAllAddresses } from "./controllers/getall.address.js";
import { getAddressById } from "./controllers/get.addressById.js";
import { createAddress }  from "./controllers/create.address.js";
import { updateAddress }  from "./controllers/update.address.js";
import { deleteAddress }  from "./controllers/delete.address.js";


const router = Router();


router.get("/all-address", getAllAddresses);
router.get("/:id",         getAddressById);
router.post("/create-address",  createAddress);
router.put("/update/:id",       updateAddress);
router.delete("/delete/:id",    deleteAddress);

export default router;
