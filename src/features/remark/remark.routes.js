import { Router } from "express";
import { createRemark } from "./controllers/create.remark.js";
import { getAllRemarks } from "./controllers/getall.remark.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";

const router = Router();

router.get("/all-remark", isAuthenticated, getAllRemarks);
router.post("/create-remark", isAuthenticated, createRemark);

export default router;
