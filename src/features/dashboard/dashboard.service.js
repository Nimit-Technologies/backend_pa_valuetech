import { getBranchCounts } from "../branch/utils/branch-count.js";
import { getDepartmentCounts } from "../departments/utils/department-count.js";
import { getRoleCounts } from "../roles/utils/role-count.js";
import { getUserCounts } from "../users/utils/user-count.js";

// Each feature keeps an exact in-process { total, active } counter that is
// updated on every write and reconciled from the database every few minutes,
// so this is four cache reads on the hot path, not four aggregate queries.
// A counter that could not be loaded reports { total: null, active: null };
// the client renders that as unknown rather than zero.
export const getSuperAdminSummary = async () => {
  const [branches, departments, roles, users] = await Promise.all([
    getBranchCounts(),
    getDepartmentCounts(),
    getRoleCounts(),
    getUserCounts(),
  ]);

  return { branches, departments, roles, users };
};
