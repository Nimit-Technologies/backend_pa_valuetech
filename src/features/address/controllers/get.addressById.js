import { getAddressById as getAddressByIdService } from "../services/service.getById.address.js";

export const getAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        const address = await getAddressByIdService(id);

        if (!address) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        res.json({ success: true, data: address });
    } catch (error) {
        console.error("getAddressById error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch address" });
    }
};
