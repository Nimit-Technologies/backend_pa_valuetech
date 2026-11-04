import { Router } from "express";
import multer from "multer";
import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { CREDENTIALS } from "../../constant/credentials.js";
import { uploadCaseFile, getCaseFileSignedUrl } from "./uploads.controller.js";
import { caseFileFilter } from "./utils/case-file-filter.js";

// Memory storage: these are case photos and short PDFs, not the resumable
// Tus/S3 transport for large assets (a separate, later task) — buffering one
// in RAM to hand straight to Supabase Storage is the simplest thing that
// works at this size.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: CREDENTIALS.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: caseFileFilter,
});

// multer reports its own errors (oversized file, rejected MIME type) through
// a callback rather than throwing, so they're translated to the same
// { success: false, message } shape as the rest of this API here, before the
// controller — which never sees a request that failed either check — runs.
const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: `File exceeds the ${CREDENTIALS.UPLOAD_MAX_FILE_SIZE_MB}MB limit`,
      });
    }

    const statusCode =
      Number.isInteger(err.statusCode) && err.statusCode < 500
        ? err.statusCode
        : 400;

    return res
      .status(statusCode)
      .json({ success: false, message: err.message || "Upload failed" });
  });
};

const router = Router();

router.post("/case/:caseId", isAuthenticated, handleUpload, uploadCaseFile);
router.get("/:fileId/signed-url", isAuthenticated, getCaseFileSignedUrl);

export default router;
