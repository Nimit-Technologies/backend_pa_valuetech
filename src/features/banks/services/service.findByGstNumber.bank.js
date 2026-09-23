import prisma from "../../../prisma/client.js";

// A bank's GST number is unique per branch, not globally: the same GST
// number may be reused under a different branch.
export const findBankByGstNumber = (gst_number, branch_id) => {
  return prisma.bank.findFirst({
    where: {
      gst_number: { equals: gst_number, mode: "insensitive" },
      branch_id,
    },
  });
};
