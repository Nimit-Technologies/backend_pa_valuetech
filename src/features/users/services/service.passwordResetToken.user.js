import prisma from "../../../prisma/client.js";
import { hashResetToken } from "../utils/password.util.js";

export const replaceUserResetTokens = (userId, tokenHash, expiresAt) =>
  prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { user_id: userId } }),
    prisma.passwordResetToken.create({
      data: { user_id: userId, token_hash: tokenHash, expires_at: expiresAt },
    }),
  ]);

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

export const deleteResetToken = (id) =>
  prisma.passwordResetToken.delete({ where: { id } });

export const purgeExpiredResetTokens = () =>
  prisma.passwordResetToken.deleteMany({
    where: { expires_at: { lt: new Date() } },
  });
