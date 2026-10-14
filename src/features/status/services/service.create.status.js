import prisma from "../../../prisma/client.js";
import { statusSelect } from "./status.service.helpers.js";

export const createStatus = ({ code, name, sort_order, is_terminal }) => {
  return prisma.status.create({
    // sort_order is left out when undefined so the column's @default(0)
    // applies, rather than Prisma receiving an explicit undefined.
    data: {
      code,
      name,
      is_terminal,
      ...(sort_order !== undefined && { sort_order }),
    },
    select: statusSelect,
  });
};
