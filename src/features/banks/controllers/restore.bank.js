import { getBankById } from "../services/service.getById.bank.js";
import { restoreBank as restoreBankService } from "../services/service.restore.bank.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
export const restoreBank = async (req, res, next) => {
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
    const existing = await getBankById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found" });
    }

    const scope = resolveBranchScope(req);
    if (scope && existing.branch_id !== scope) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found" });
    }

    if (!existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Bank is not soft-deleted" });
    }

    const bank = await restoreBankService(id);

    logAuthEvent("bank_restored", {
      bank_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Bank restored successfully",
      data: bank,
    });
  } catch (error) {
    console.error("restoreBank error:", error);
    res.status(500).json({ success: false, message: "Failed to restore bank" });
  }
};
