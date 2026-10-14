import { Router } from "express";
import { createRemark } from "./controllers/create.remark.js";
import { getAllRemarks } from "./controllers/getall.remark.js";
import { updateRemark } from "./controllers/update.remark.js";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";

const router = Router();

// Remarks belong to a case and are public within the branch: any authenticated
// user may read and add them, regardless of whether they can see the case
// itself (see utils/remark-scope.js). The case id is required rather than an
// optional filter, so there is no branch-wide feed to enumerate.
//
// No role guards: every role takes part in the conversation on a case.
router.get("/:id", isAuthenticated, getAllRemarks);
router.post("/:id", isAuthenticated, createRemark);

// Editing is author-only, checked in the controller against the session user.
// There is no delete and no moderation path — nobody can remove someone else's
// remark, by design.
router.patch("/update/:id", isAuthenticated, updateRemark);

export default router;
