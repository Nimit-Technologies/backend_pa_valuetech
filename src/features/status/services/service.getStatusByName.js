import prisma from "../../../prisma/client.js";
import { statusSelect } from "./status.service.helpers.js";

// Deliberately does NOT filter out soft-deleted rows. `name` is a plain global
// @unique in status.prisma, and that constraint does not exclude soft-deleted
// rows — a soft-deleted "pending" still occupies the name. Filtering them out
// here would let the duplicate check pass and the insert then fail with a raw
// P2002, so the callers inspect `deleted_at` on the hit and tell the client to
// restore the existing row instead.
//
// `excludeId` is for the update path, where the row being renamed must not
// count as its own duplicate.
export const findStatusByName = (name, excludeId) => {
  return prisma.status.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: statusSelect,
  });
};
