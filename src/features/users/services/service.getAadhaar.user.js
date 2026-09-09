import prisma from "../../../prisma/client.js";
import { decryptStored } from "../../../utils/encryption.js";

// Small, non-sensitive view of the matched user returned alongside the
// revealed Aadhaar so the caller can confirm they hit the right person.
const userSummarySelect = {
  id: true,
  employee_id: true,
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
};

/**
 * Finds a user by their employee_id and returns their Aadhaar number
 * decrypted in full, with a short user summary.
 *
 * @param {Object} params
 * @param {string} params.employee_id - Normalised (trimmed, lowercased) employee id
 * @returns {Promise<{ original_aadhaar_number: string, user: Object }|null>}
 *   null when no user has that employee_id, or when the stored ciphertext
 *   can't be decrypted with the current ENCRYPTION_KEY.
 */
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
