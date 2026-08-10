import { getAllAddresses as getAllAddressesService } from "../services/service.getall.address.js";

export const getAllAddresses = async (req, res) => {
  try {
    const addresses = await getAllAddressesService();
    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error("getAllAddresses error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch addresses" });
  }
};
