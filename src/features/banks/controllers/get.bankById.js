import { getBankById as getBankByIdService } from "../services/service.getById.bank.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { formatBankResponse } from "../utils/bank-history.js";

export const getBankById = async (req, res, next) => {
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

    // Resolved before the DB call so a branch-scoped caller's branch_id is
    // filtered in the query itself, instead of fetching the bank first and
    // discarding it after if it belongs to another branch.
    const scope = resolveBranchScope(req);
    const bank = await getBankByIdService(id, scope);

    if (!bank) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found" });
    }

    res.json({ success: true, data: formatBankResponse(bank) });
  } catch (error) {
    console.error("getBankById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bank" });
  }
};
