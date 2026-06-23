import bcrypt from "bcrypt";
import jwt    from "jsonwebtoken";

import { loginSchema }      from "../auth.schema.js";
import { findUserForLogin } from "../services/service.auth.login.js";
import { CREDENTIALS }      from "../../../constant/credentials.js";

export const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }

    const { employee_id, password } = parsed.data;

    const user = await findUserForLogin(employee_id);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const payload = {
      id:          user.id,
      employee_id: user.employee_id,
      role:        user.role,
      // branch_id:   user.branch_id,
      // department_id: user.department_id,
    };

    const token = jwt.sign(payload, CREDENTIALS.JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   24 * 60 * 60 * 1000,
    });

    const { password: _pwd, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      token,
      data: userWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
