import prisma from "../../../prisma/client.js";
import { decryptStored } from "../../../utils/encryption.js";

const userSummarySelect = {
  id: true,
  employee_id: true,
};

export const getOriginalAadhaarService = async ({ employee_id }) => {
  const user = await prisma.user.findFirst({
    where: { employee_id: { equals: employee_id, mode: "insensitive" } },
    select: { ...userSummarySelect, aadhaar_number: true },
  });

  if (!user) return null;

  const original = decryptStored(user.aadhaar_number);
  if (!original) return null;

  const { aadhaar_number: _stored, ...summary } = user;
  return { original_aadhaar_number: original, user: summary };
};
