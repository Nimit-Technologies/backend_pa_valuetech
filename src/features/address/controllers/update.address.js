import { getAddressById } from "../services/service.getById.address.js";
import { updateAddress as updateAddressService } from "../services/service.update.address.js";
import { addressSchema } from "../address.schema.js";

export const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;

        const parsed = addressSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.issues });
        }

        const existing = await getAddressById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        const address = await updateAddressService(id, parsed.data);
        res.json({ success: true, data: address });
    } catch (error) {
        console.error("updateAddress error:", error);
        res.status(500).json({ success: false, message: "Failed to update address" });
    }
};
