import prisma from "../../../prisma/client.js";

// File numbers are unique per branch, not globally: the same file number may
// exist under two different branches, so the duplicate check is scoped to
// branch_id.
//
// Soft-deleted cases are deliberately NOT excluded — a file number stays taken
// while the case is only soft-deleted, so restoring it can never collide with
// a newer case that reused the number.
export const findCaseByFileNumber = (file_number, branch_id) => {
  return prisma.case.findFirst({
    where: {
      file_number: { equals: file_number, mode: "insensitive" },
      branch_id,
    },
  });
};
