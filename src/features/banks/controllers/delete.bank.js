import { getBankById } from "../services/service.getById.bank.js";
import { deleteBank as deleteBankService } from "../services/service.delete.bank.js";

export const deleteBank = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getBankById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Bank not found" });
    }

    await deleteBankService(id);
    res.json({ success: true, message: "Bank deleted successfully" });
  } catch (error) {
    if (error?.code === "P2003" || error?.code === "P2014") {
      return res.status(409).json({ success: false, message: "Cannot delete bank: it is still referenced by other records" });
    }
    console.error("deleteBank error:", error);
    res.status(500).json({ success: false, message: "Failed to delete bank" });
  }
};
