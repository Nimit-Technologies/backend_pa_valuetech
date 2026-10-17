import prisma from "../../../prisma/client.js";
import { statusSelect } from "./status.service.helpers.js";

// Resolves a status by its stable machine key. Used both by the duplicate check
// on create and by the case module, which needs the `open` row's id without
// depending on a name a super admin can rename.
//
// Deliberately does NOT filter out soft-deleted rows: `code` is a plain
// @unique, and that constraint covers soft-deleted rows too, so the code is
// taken either way. Callers inspect `deleted_at` on the hit and decide whether
// to report a conflict or tell the client to restore the existing row.
export const findStatusByCode = (code) => {
  return prisma.status.findUnique({
    where: { code },
    select: statusSelect,
  });
};
