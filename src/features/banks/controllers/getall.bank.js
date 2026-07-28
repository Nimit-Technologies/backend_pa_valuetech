import { getAllBanks as getAllBanksService } from "../services/service.getall.bank.js";

export const getAllBanks = async (req, res) => {
  try {
    const banks = await getAllBanksService();
    res.json({ success: true, data: banks });
  } catch (error) {
    console.error("getAllBanks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch banks" });
  }
};
