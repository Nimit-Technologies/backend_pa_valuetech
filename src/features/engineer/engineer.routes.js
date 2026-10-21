import { Router } from "express";
import { getMyTasks } from "./controllers/engineer.getMyTasks.js";
import { getMyTaskById } from "./controllers/engineer.getMyTaskById.js";
import { getMyTaskSummary } from "./controllers/engineer.getTaskSummary.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isEngineer } from "../../middlewares/authorize.js";

const router = Router();

// Status changes are deliberately NOT here: PATCH /case/status/:id already gates
// every engineer move through constant/case-transitions.js, and a second path to
// the same write is how two sets of rules start disagreeing.

// "/my-task/summary" is declared above "/my-task/:id", or the literal path would
// be swallowed as a case id — the same ordering rule case.routes.js follows for
// "/similar" above "/:id".
router.get("/my-task/summary", isAuthenticated, isEngineer, getMyTaskSummary);
router.get("/my-task", isAuthenticated, isEngineer, getMyTasks);
router.get("/my-task/:id", isAuthenticated, isEngineer, getMyTaskById);

export default router;
