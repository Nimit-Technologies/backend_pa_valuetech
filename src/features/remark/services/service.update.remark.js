import prisma from "../../../prisma/client.js";
import { remarkInclude, shapeRemark } from "./remark.service.helpers.js";

// Remarks keep no edit history: an edit overwrites the content, and `updated_at`
// is the only trace. That is why the reason behind a status transition lives on
// the immutable history row instead of here — an audit reason has to stay
// tamper-evident, and this one cannot.
export const updateRemark = async (id, content) => {
  const remark = await prisma.remark.update({
    where: { id },
    data: { content },
    include: remarkInclude,
  });

  return shapeRemark(remark);
};
