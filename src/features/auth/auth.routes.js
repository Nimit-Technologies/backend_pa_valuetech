import { Router } from "express";
import { login }  from "./controllers/auth.login.js";
import { logout } from "./controllers/auth.logout.js";

const router = Router();

router.post("/login",  login);
router.post("/logout", logout);

export default router;
