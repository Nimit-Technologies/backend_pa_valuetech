import { getUserById as getUserByIdService } from "../services/service.getById.user.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { formatUserResponse } from "../utils/user-history.js";

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isValidId = isValidCuid(id);

    if (!isValidId) {
      if (!looksLikeAnId(id)) {
        // Not even shaped like an id — most likely a mistyped/renamed
        // route falling through to :id. Let Express keep matching so
        // app.js's catch-all reports the real "Route not found".
        return next();
      }
      return res
        .status(404)
        .json({ success: false, message: "Id is not valid" });
    }
    const user = await getUserByIdService(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: formatUserResponse(user) });
  } catch (error) {
    console.error("getUserById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};
