import { getUserById } from "../services/service.getById.user.js";
import { updateUser as updateUserService } from "../services/service.update.user.js";
import { updateOwnProfileSchema } from "../user.schema.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import { encrypt, blindIndex } from "../../../utils/encryption.js";
import {
  createUserHistoryEntry,
  formatUserResponse,
} from "../utils/user-history.js";
import { hasChanges } from "../utils/user-has-changes.js";

/**
 * PUT /api/v1/user/profile  (isAuthenticated)
 *
 * The logged-in user edits their OWN personal details. Deliberately separate
 * from the admin PUT /user/update/:id path: it always acts on req.user.id
 * (any :id in the URL would be ignored, so there isn't one), and the schema
 * excludes employee_id, branch_id, department_id, role_id, is_active and
 * password — those stay admin-only or have their own route.
 */
export const updateOwnProfile = async (req, res) => {
  try {
    const parsed = updateOwnProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }

    const userId = req.user.id;
    const existing = await getUserById(userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Account is no longer active. Please contact your administrator.",
      });
    }

    if (!hasChanges(existing, parsed.data)) {
      return res.json({ success: true, message: "No changes are found" });
    }

    const updateData = { ...parsed.data };

    // Same treatment as the admin update path: hash computed from the
    // plaintext before it's overwritten with ciphertext.
    if (updateData.aadhaar_number !== undefined) {
      updateData.aadhaar_hash = blindIndex(updateData.aadhaar_number);
      updateData.aadhaar_number = encrypt(updateData.aadhaar_number);
    }

    const historyEntry = createUserHistoryEntry("PROFILE_UPDATE", req.user);
    const user = await updateUserService(
      userId,
      updateData,
      historyEntry,
      existing,
    );

    logAuthEvent("user_profile_updated", {
      user_id: userId,
      actor_id: userId,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: formatUserResponse(user),
    });
  } catch (error) {
    if (error?.code === "P2002") {
      console.error("updateOwnProfile error: aadhaar already in use");
      return res
        .status(409)
        .json({ success: false, message: "Aadhaar number already in use" });
    }
    console.error("updateOwnProfile error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};
