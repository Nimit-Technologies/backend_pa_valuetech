import prisma from "../../../prisma/client.js";
import { remarkInclude, shapeRemark } from "./remark.service.helpers.js";

// Returns the remark with just enough of its case to authorize an edit: the
// branch it belongs to, and whether its status has frozen the case.
export const getRemarkById = async (id) => {
  const remark = await prisma.remark.findUnique({
    where: { id },
    include: {
      ...remarkInclude,
      case: {
        select: {
          id: true,
          branch_id: true,
          deleted_at: true,
          status: { select: { code: true, name: true, is_terminal: true } },
        },
      },
    },
  });

  return shapeRemark(remark);
};
