import { getBusinessTypeById } from "../services/service.get.business-typeById.js";
import { setBusinessTypeStatus } from "../services/service.updateStatus.business-type.js";

export const updateBusinessTypeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getBusinessTypeById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Business type not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Business type is soft-deleted; restore it before changing status",
      });
    }

    const is_active = !existing.is_active;
    const businessType = await setBusinessTypeStatus(id, is_active);
    res.json({
      success: true,
      message: `Business type ${is_active ? "activated" : "deactivated"} successfully`,
      data: businessType    ,
    });
  } catch (error) {
    console.error("updateBusinessTypeStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update business type status" });
  }
};
