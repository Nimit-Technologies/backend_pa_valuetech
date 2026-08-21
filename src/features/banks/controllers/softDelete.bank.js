import { getBankById } from "../services/service.getById.bank.js";
import { softDeleteBank as softDeleteBankService } from "../services/service.softDelete.bank.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
export const softDeleteBank = async (req, res, next) => {
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

    if (existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Bank is already deleted" });
    }

    const bank = await softDeleteBankService(id);

    logAuthEvent("bank_soft_deleted", {
      bank_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Bank soft-deleted successfully",
      data: bank,
    });
  } catch (error) {
    console.error("softDeleteBank error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to soft-delete bank" });
  }
};
