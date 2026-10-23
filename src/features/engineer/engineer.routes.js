import { Router } from "express";
import { getMyTasks } from "./controllers/engineer.getMyTasks.js";
import { getMyTaskById } from "./controllers/engineer.getMyTaskById.js";
import { getMyTaskSummary } from "./controllers/engineer.getTaskSummary.js";
import { saveReport } from "./controllers/engineer.saveReport.js";
import { getMyReport } from "./controllers/engineer.getReport.js";
import { getMySubmittedReport } from "./controllers/engineer.getSubmittedReport.js";
import { getMySubmittedReports } from "./controllers/engineer.getMySubmittedReports.js";
import { getBranchSubmittedReport } from "./controllers/engineer.getBranchSubmittedReport.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { isEngineer } from "../../middlewares/authorize.js";

const router = Router();

router.get("/my-task/summary", isAuthenticated, isEngineer, getMyTaskSummary);
router.get("/my-task", isAuthenticated, isEngineer, getMyTasks);
router.get("/my-task/:id", isAuthenticated, isEngineer, getMyTaskById);
router.get("/my-task/:id/report", isAuthenticated, isEngineer, getMyReport);
router.get("/my-reports", isAuthenticated, isEngineer, getMySubmittedReports);
router.get("/case/:id/report", isAuthenticated, getBranchSubmittedReport);
router.get(
  "/my-case/:id/report",
  isAuthenticated,
  isEngineer,
  getMySubmittedReport,
);
router.post("/my-task/:id/report", isAuthenticated, isEngineer, saveReport);

export default router;
