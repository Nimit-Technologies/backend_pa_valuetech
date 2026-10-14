import prisma from "../../../prisma/client.js";
import { statusSelect } from "./status.service.helpers.js";

// Returns soft-deleted rows too — the lifecycle controllers need to tell
// "missing" apart from "soft-deleted" to pick the right 404 vs 409, and
// restore needs to find the row at all.
export const getStatusById = (id) => {
  return prisma.status.findUnique({
    where: { id },
    select: statusSelect,
  });
};
