import { toAuthUser } from "../auth.serializer.js";

export const session = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Session is valid",
    data: toAuthUser(req.user),
  });
};
