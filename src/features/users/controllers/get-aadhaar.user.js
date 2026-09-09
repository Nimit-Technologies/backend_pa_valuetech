import { getOriginalAadhaarService } from "../services/service.getAadhaar.user.js";
import { aadhaarLookupSchema } from "../user.schema.js";
import { logAuthEvent } from "../../../utils/audit-log.js";

/**
 * POST /api/v1/user/get-aadhaar  (authenticated admin)
 *
 * Body: { employee_id: "emp12373" }
 * Returns that user's Aadhaar number decrypted in full — this is the only
 * endpoint that does so; every other response keeps it masked/encrypted.
 * Each successful reveal is written to the audit log.
 */
export const getOriginalAadhaar = async (req, res) => {
  try {
    const parsed = aadhaarLookupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const result = await getOriginalAadhaarService(parsed.data);

    if (!result) {
      logAuthEvent("aadhaar_view_missed", {
        actor_id: req.user?.id ?? null,
        ip: req.ip,
        success: false,
      });
      return res.status(404).json({
        success: false,
        message: "No user found with that employee ID",
      });
    }

    logAuthEvent("aadhaar_viewed", {
      actor_id: req.user?.id ?? null,
      target_user_id: result.user.id,
      ip: req.ip,
      success: true,
    });

    return res.json({
      success: true,
      message: "Original Aadhaar number retrieved successfully",
      data: {
        aadhaar_number: result.original_aadhaar_number,
        user: result.user,
      },
    });
  } catch (error) {
    console.error("getOriginalAadhaar error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve original Aadhaar number",
    });
  }
};
