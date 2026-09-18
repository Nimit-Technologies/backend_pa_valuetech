import prisma from "../../../prisma/client.js";

export const bumpTokenVersion = (id) =>
  prisma.user.update({
    where: { id },
    data: { token_version: { increment: 1 } },
    select: { id: true, token_version: true },
  });
