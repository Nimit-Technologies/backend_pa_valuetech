import { createAddress as createAddressService } from "../services/service.create.address.js";
import { addressSchema } from "../address.schema.js";

export const createAddress = async (req, res) => {
    try {
        const parsed = addressSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.issues });
        }

        const address = await createAddressService(parsed.data);
        res.status(201).json({ success: true, data: address });
    } catch (error) {
        console.error("createAddress error:", error);
        res.status(500).json({ success: false, message: "Failed to create address" });
    }
};
