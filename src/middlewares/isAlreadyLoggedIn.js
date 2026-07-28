import jwt from "jsonwebtoken";
import { CREDENTIALS } from "../constant/credentials.js";

export const isAlreadyLoggedIn = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, CREDENTIALS.JWT_SECRET);
    return res.status(200).json({
      success: true,
      message: "Already logged in",
      data: {
        id:          decoded.id,
        employee_id: decoded.employee_id,
        branch:      decoded.branch,
        department:  decoded.department,
        role:        decoded.role,
      },
    });
  } catch (error) {
    // missing/expired/invalid token — clear it and let the request through to login
    res.clearCookie("token", {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return next();
  }
};
