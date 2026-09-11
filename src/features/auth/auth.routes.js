import { Router } from "express";
import { login } from "./controllers/auth.login.js";
import { logout } from "./controllers/auth.logout.js";
import { session } from "./controllers/auth.session.js";
import { isAlreadyLoggedIn } from "../../middlewares/isAlreadyLoggedIn.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isLoggedIn } from "../../middlewares/isLoggedIn.js";
import { loginLimiter } from "../../middlewares/login-limiter.js";
import { accountLoginLimiter } from "../../middlewares/account-login-limiter.js";
import { logoutLimiter } from "../../middlewares/logout-limiter.js";

const router = Router();

router.post(
  "/login",
  loginLimiter,
  accountLoginLimiter,
  isAlreadyLoggedIn,
  login,
);
router.post("/logout", logoutLimiter, isLoggedIn, logout);
router.get("/session", loginLimiter, isAuthenticated, session);

export default router;
