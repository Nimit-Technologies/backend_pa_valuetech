import { getUserByEmployeeId }             from "../services/service.getByEmployeeId.js";
import { createUser as createUserService } from "../services/service.create.user.js";
import { userSchema }                      from "../user.schema.js";
import bcrypt from "bcrypt";
import { CREDENTIALS } from "../../../constant/credentials.js";

export const createUser = async (req, res) => {
  try {
    const { confirm_password } = req.body;
    if (!confirm_password) {
      return res.status(400).json({ success: false, message: "Confirm password is required" });
    }
    if (req.body.password !== confirm_password) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }

    const {
      employee_id, first_name, last_name, email, phone,
      password, adhar_number, branch_id, department_id, role_id, address,
    } = parsed.data;

    const existing = await getUserByEmployeeId(employee_id);
    if (existing) {
      return res.status(409).json({ success: false, message: "User with this employee ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, CREDENTIALS.SALT_ROUNDS);

    const user = await createUserService({
      employee_id, first_name, last_name, email, phone,
      password: hashedPassword, adhar_number, branch_id, department_id, role_id, address,
    });

    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    if (error?.code === "P2002") {
      const field = error.meta?.target?.[0];
      return res.status(409).json({ success: false, message: `${field} already exists` });
    }
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Branch, department, or role not found" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
