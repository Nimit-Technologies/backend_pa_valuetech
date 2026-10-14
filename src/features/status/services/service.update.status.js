import prisma from "../../../prisma/client.js";
import { statusSelect } from "./status.service.helpers.js";

export const updateStatus = (id, data) => {
  return prisma.status.update({
    where: { id },
    data,
    select: statusSelect,
  });
};
