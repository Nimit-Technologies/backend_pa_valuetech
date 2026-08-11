import { getAddressById } from "../services/service.getById.address.js";
import { deleteAddress as deleteAddressService } from "../services/service.delete.address.js";

export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getAddressById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    await deleteAddressService(id);
    res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("deleteAddress error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete address" });
  }
};
