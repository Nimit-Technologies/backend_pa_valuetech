import { isValidCuid } from "../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../utils/branch-scope.js";
import { logAuthEvent } from "../../utils/audit-log.js";
import { signedUrlQuerySchema } from "./uploads.schema.js";
import {
  createCaseFile,
  createSignedUrlForCaseFile,
  loadCaseForUpload,
  loadCaseFileForRead,
} from "./uploads.service.js";

// Masked down to what a client needs to confirm the write — never the
// storage path itself, and never a public or signed URL (that's a separate,
// explicit request to GET /uploads/:fileId/signed-url).
const formatCaseFileResponse = (caseFile) => ({
  id: caseFile.id,
  case_id: caseFile.case_id,
  original_name: caseFile.original_name,
  mime_type: caseFile.mime_type,
  size_bytes: caseFile.size_bytes,
  uploaded_at: caseFile.uploaded_at,
});

export const uploadCaseFile = async (req, res) => {
  try {
    const { caseId } = req.params;

    if (!isValidCuid(caseId)) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "A file is required" });
    }

    const scopedBranchId = resolveBranchScope(req);
    const caseRecord = await loadCaseForUpload(caseId, scopedBranchId);

    if (!caseRecord) {
      // Deliberately the same response whether the case doesn't exist or
      // exists in a branch the caller cannot reach — see branch-scope.js.
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    if (caseRecord.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Case is deleted; files cannot be uploaded to it",
      });
    }

    const actor = {
      id: req.user.id,
      employee_id: req.user.employee_id,
      role: req.user.role?.name,
    };

    const caseFile = await createCaseFile({
      caseRecord,
      actor,
      file: req.file,
    });

    // Case id and file id only — never the storage path alongside the
    // uploader's identity, per the task's logging rule.
    logAuthEvent("case_file_uploaded", {
      case_id: caseRecord.id,
      file_id: caseFile.id,
      actor_id: req.user.id,
      ip: req.ip,
      success: true,
    });

    res
      .status(201)
      .json({ success: true, data: formatCaseFileResponse(caseFile) });
  } catch (error) {
    console.error("uploadCaseFile error:", error);
    res.status(500).json({ success: false, message: "Failed to upload file" });
  }
};

export const getCaseFileSignedUrl = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!isValidCuid(fileId)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    const parsed = signedUrlQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const scopedBranchId = resolveBranchScope(req);
    const caseFile = await loadCaseFileForRead(fileId, scopedBranchId);

    if (!caseFile) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    const url = await createSignedUrlForCaseFile(
      caseFile.storage_path,
      parsed.data.expires_in,
    );

    logAuthEvent("case_file_signed_url_issued", {
      case_id: caseFile.case_id,
      file_id: caseFile.id,
      actor_id: req.user.id,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      data: { url, expires_in: parsed.data.expires_in },
    });
  } catch (error) {
    console.error("getCaseFileSignedUrl error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create signed link" });
  }
};
