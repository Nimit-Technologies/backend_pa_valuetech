import { getBankById } from "../services/service.getById.bank.js";
import { restoreBank as restoreBankService } from "../services/service.restore.bank.js";
import { getBranchById } from "../../branch/services/service.getById.branch.js";
import { respondIfInvalidParent } from "../../../utils/validate-parent-entity.js";
import { isValidCuid, looksLikeAnId } from "../../../utils/is-valid-cuid.js";
import { resolveBranchScope } from "../../../utils/branch-scope.js";
import { logAuthEvent } from "../../../utils/audit-log.js";
import {
  createBankHistoryEntry,
  formatBankResponse,
} from "../utils/bank-history.js";

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
    // Resolved before the DB call so a branch-scoped caller's branch_id is
    // filtered in the query itself, instead of fetching the bank first and
    // discarding it after if it belongs to another branch.
    const scope = resolveBranchScope(req);
    const existing = await getBankById(id, scope);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found" });
    }

    if (!existing.deleted_at) {
      return res
        .status(409)
        .json({ success: false, message: "Bank is not soft-deleted" });
    }

    const branch = await getBranchById(existing.branch_id);
    if (
      respondIfInvalidParent(res, branch, {
        label: "Branch",
        action: "restore this bank",
      })
    )
      return;

    const historyEntry = createBankHistoryEntry("RESTORE", req.user);
    const bank = await restoreBankService(id, historyEntry, existing);

    logAuthEvent("bank_restored", {
      bank_id: id,
      actor_id: req.user?.id ?? null,
      ip: req.ip,
      success: true,
    });

    res.json({
      success: true,
      message: "Bank restored successfully",
      data: formatBankResponse(bank),
    });
  } catch (error) {
    console.error("restoreBank error:", error);
    res.status(500).json({ success: false, message: "Failed to restore bank" });
  }
};
