import { getBusinessTypeById } from "../services/service.get.business-typeById.js";
import { restoreBusinessType as restoreBusinessTypeService } from "../services/service.restore.business-type.js";

export const restoreBusinessType = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getBusinessTypeById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Business type not found" });
    }

    if (!existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Business type is not soft-deleted" });
    }

    const businessType = await restoreBusinessTypeService(id);
    res.json({
      success: true,
      message: "Business type restored successfully",
      data: businessType,
    });
  } catch (error) {
    console.error("restoreBusinessType error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to restore business type" });
  }
};
