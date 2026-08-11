import { getBankById } from "../services/service.getById.bank.js";
import { setBankStatus } from "../services/service.updateStatus.bank.js";

export const updateBankStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getBankById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found" });
    }

    if (existing.deleted_at) {
      return res.status(409).json({
        success: false,
        message: "Bank is soft-deleted; restore it before changing status",
      });
    }

    const is_active = !existing.is_active;
    const bank = await setBankStatus(id, is_active);
    res.json({
      success: true,
      message: `Bank ${is_active ? "activated" : "deactivated"} successfully`,
      data: bank,
    });
  } catch (error) {
    console.error("updateBankStatus error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update bank status" });
  }
};
