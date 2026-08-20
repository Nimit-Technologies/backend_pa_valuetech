import { getBusinessTypeById as getBusinessTypeByIdService } from "../services/service.get.business-typeById.js";

export const getBusinessTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const businessType = await getBusinessTypeByIdService(id);

    if (!businessType || businessType.deleted_at) {
      return res
        .status(404)
        .json({ success: false, message: "Business type not found" });
    }

    res.json({ success: true, data: businessType });
  } catch (error) {
    console.error("getBusinessTypeById error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch business type" });
  }
};
