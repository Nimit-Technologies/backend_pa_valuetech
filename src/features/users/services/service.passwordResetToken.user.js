import prisma from "../../../prisma/client.js";
import { hashResetToken } from "../utils/password.util.js";

/**
 * Persistence for the forgot-password flow. Backed by the
 * `password_reset_tokens` table (see prisma/schema/password_reset_token.prisma)
 * — run `npm run migrate` before the forgot/reset endpoints will work.
 *
 * Only the SHA-256 hash of a token is ever stored here; the raw token lives
 * only in the reset link sent to the user.
 */

/**
 * Issue a fresh reset token for a user, invalidating any outstanding ones.
 * A single request should never leave several usable links live at once, so
 * old rows for this user are deleted in the same transaction.
 *
 * @param {string} userId
 * @param {string} tokenHash  from generateResetToken().tokenHash
 * @param {Date}   expiresAt  from generateResetToken().expiresAt
 */
export const replaceUserResetTokens = (userId, tokenHash, expiresAt) =>
  prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { user_id: userId } }),
    prisma.passwordResetToken.create({
      data: { user_id: userId, token_hash: tokenHash, expires_at: expiresAt },
    }),
  ]);

/**
 * Look up a reset-token row by the raw token, with the minimal user fields
 * the reset controller needs. Returns null when the token is unknown.
 * Expiry / single-use / account-state checks are the caller's job.
 *
 * @param {string} rawToken
 */
export const findResetTokenByRaw = (rawToken) =>
  prisma.passwordResetToken.findUnique({
    where: { token_hash: hashResetToken(rawToken) },
    include: {
      user: {
        select: {
          id: true,
          employee_id: true,
          first_name: true,
          last_name: true,
          is_active: true,
          deleted_at: true,
          history: true,
        },
      },
    },
  });

/** Burn a reset token after a successful reset (single-use). */
export const deleteResetToken = (id) =>
  prisma.passwordResetToken.delete({ where: { id } });

/**
 * Housekeeping: drop every expired row. Safe to call from a cron job or
 * opportunistically; not required for correctness (the reset controller
 * rejects expired tokens regardless).
 */
export const purgeExpiredResetTokens = () =>
  prisma.passwordResetToken.deleteMany({
    where: { expires_at: { lt: new Date() } },
  });
