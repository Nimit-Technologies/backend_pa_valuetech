import { getBankById } from "../services/service.getById.bank.js";
import { restoreBank as restoreBankService } from "../services/service.restore.bank.js";

export const restoreBank = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getBankById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Bank not found" });
    }

    if (!existing.deleted_at) {
      return res.status(409).json({ success: false, message: "Bank is not soft-deleted" });
    }

    const bank = await restoreBankService(id);
    res.json({ success: true, message: "Bank restored successfully", data: bank });
  } catch (error) {
    console.error("restoreBank error:", error);
    res.status(500).json({ success: false, message: "Failed to restore bank" });
  }
};
