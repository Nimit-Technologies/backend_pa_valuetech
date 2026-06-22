import { z } from "zod";
import { getUserById }                   from "../services/service.getById.user.js";
import { updateUser as updateUserService } from "../services/service.update.user.js";

const updateUserSchema = z.object({
  first_name:    z.string().min(1).max(50).optional(),
  last_name:     z.string().min(1).max(50).optional(),
  email:         z.string().email().max(100).optional(),
  phone:         z.string().min(10).max(15).optional(),
  branch_id:     z.string().min(1).optional(),
  department_id: z.string().min(1).optional(),
  role_id:       z.string().min(1).optional(),
  is_active:     z.boolean().optional(),
}).strict();

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }

    const existing = await getUserById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = await updateUserService(id, parsed.data);
    res.json({ success: true, data: user });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = error.meta?.target?.[0];
      return res.status(409).json({ success: false, message: `${field} already exists` });
    }
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};
