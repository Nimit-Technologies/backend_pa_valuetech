import { Router } from "express";
import { login }   from "./controllers/auth.login.js";
import { logout }  from "./controllers/auth.logout.js";
import { session } from "./controllers/auth.session.js";
import { isAlreadyLoggedIn } from "../../middlewares/isAlreadyLoggedIn.js";
import { isAuthenticated }   from "../../middlewares/isAuthenticated.js";

const router = Router();

router.post("/login", isAlreadyLoggedIn, login);
router.post("/logout", logout);
router.get("/session", isAuthenticated, session);

export default router;
