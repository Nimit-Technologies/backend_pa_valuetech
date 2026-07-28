import { getBankById as getBankByIdService } from "../services/service.getById.bank.js";

export const getBankById = async (req, res) => {
  try {
    const { id } = req.params;
    const bank = await getBankByIdService(id);

    if (!bank) {
      return res.status(404).json({ success: false, message: "Bank not found" });
    }

    res.json({ success: true, data: bank });
  } catch (error) {
    console.error("getBankById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bank" });
  }
};
