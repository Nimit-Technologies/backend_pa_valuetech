import { getBusinessTypeById } from "../services/service.get.business-typeById.js";
import { deleteBusinessType as deleteBusinessTypeService } from "../services/service.delete.business-type.js";
import { getBusinessTypeDependents } from "../services/service.checkDependents.business-type.js";

export const deleteBusinessType = async (req, res) => {
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
        message: "Business type is soft-deleted; restore it before deleting",
      });
    }

    const { allocations } = await getBusinessTypeDependents(id);
    if (allocations.length) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete business type: it is still referenced by one or more allocations",
        data: allocations,
      });
    }

    await deleteBusinessTypeService(id);
    res.json({ success: true, message: "Business type deleted successfully" });
  } catch (error) {
    if (error?.code === "P2003" || error?.code === "P2014") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete business type: it is still referenced by other records",
      });
    }
    console.error("deleteBusinessType error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete business type" });
  }
};
