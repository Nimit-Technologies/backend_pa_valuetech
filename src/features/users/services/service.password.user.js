import prisma from "../../../prisma/client.js";

/**
 * Fetch a user WITH the password hash — the global `omit` in
 * prisma/client.js hides it from every other query, so it's explicitly
 * opted back in here (same pattern as service.auth.login.js). Used by the
 * change-password flow, which has to verify the caller's current password.
 *
 * Returns every scalar field (including `history`, `is_active`,
 * `deleted_at`) so the controller can append audit history and re-check
 * account state without a second round-trip.
 */
export const getUserAuthById = (id) =>
  prisma.user.findUnique({
    where: { id },
    omit: { password: false },
  });

/**
 * Set a new password hash on a user.
 *
 * Bumps `token_version` so every JWT already issued to this user stops
 * working immediately (see the token_version comment on the User model) —
 * a password change must end all existing sessions, including a stolen one.
 * Appends `historyEntry` to the audit trail.
 *
 * @param {string} id
 * @param {string} hashedPassword  output of hashPassword()
 * @param {Object|null} historyEntry
 * @param {Array} [existingHistory]
 */
export const updateUserPassword = (
  id,
  hashedPassword,
  historyEntry,
  existingHistory = [],
) => {
  const currentHistory = Array.isArray(existingHistory) ? existingHistory : [];
  const updatedHistory = historyEntry
    ? [...currentHistory, historyEntry]
    : currentHistory;

  return prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      history: updatedHistory,
      token_version: { increment: 1 },
    },
    select: {
      id: true,
      employee_id: true,
      updated_at: true,
    },
  });
};
