import { getBankById } from "../services/service.getById.bank.js";
import { softDeleteBank as softDeleteBankService } from "../services/service.softDelete.bank.js";

export const softDeleteBank = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getBankById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Bank not found" });
    }
    if (existing.deleted_at) {
      return res.status(409).json({ success: false, message: "Bank is already deleted" });
    }

    const bank = await softDeleteBankService(id);
    res.json({ success: true, message: "Bank soft-deleted successfully", data: bank });
  } catch (error) {
    console.error("softDeleteBank error:", error);
    res.status(500).json({ success: false, message: "Failed to soft-delete bank" });
  }
};
