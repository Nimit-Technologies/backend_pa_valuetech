import prisma from "../../../prisma/client.js";

// Case counts for a scoped list.
//
// "Active" now means "not in a terminal status" — Case.is_active was dropped
// when the status lifecycle landed, since close and cancelled already say a
// case is finished and two overlapping flags would inevitably disagree.
//
// There is no in-memory cache: every list is branch- or assignment-scoped, so a
// global cached total could never answer any of them. A single groupBy against
// the same filter the list used is both correct and cheap, given the
// (branch_id, business_type_id) index prefix serves it.
export const getCaseCounts = async (where = {}) => {
  const [total, active] = await Promise.all([
    prisma.case.count({ where }),
    prisma.case.count({
      where: { ...where, status: { is_terminal: false } },
    }),
  ]);

  return { total, active };
};
