import prisma from "../../../prisma/client.js";

// Bumping this invalidates every JWT already issued to the user — see the
// token_version comment on the User model. Call this anywhere a previously
// issued token should stop working immediately: explicit logout, and any
// admin change that could alter what a token is allowed to do.
export const bumpTokenVersion = (id) =>
  prisma.user.update({
    where: { id },
    data: { token_version: { increment: 1 } },
    select: { token_version: true },
  });
