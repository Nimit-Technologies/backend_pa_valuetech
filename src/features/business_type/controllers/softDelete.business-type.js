import { getBusinessTypeById } from "../services/service.get.business-typeById.js";
import { softDeleteBusinessType as softDeleteBusinessTypeService } from "../services/service.softDelete.business-type.js";

export const softDeleteBusinessType = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getBusinessTypeById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Business type not found" });
    }
    if (existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Business type is already deleted" });
    }

    const businessType = await softDeleteBusinessTypeService(id);
    res.json({
      success: true,
      message: "Business type soft-deleted successfully",
      data: businessType,
    });
  } catch (error) {
    console.error("softDeleteBusinessType error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to soft-delete business type" });
  }
};
