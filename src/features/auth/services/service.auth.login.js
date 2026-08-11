import prisma from "../../../prisma/client.js";

export const findUserForLogin = (employee_id) => {
  return prisma.user.findUnique({
    where: { employee_id },

    // The Prisma client applies a global `omit: { user: { password: true } }`
    // (see ../../../prisma/client.js) so every other query never sees the
    // hash by accident. This is the one legitimate exception — login needs
    // it to run bcrypt.compare — so it's explicitly opted back in here.
    // Note: at the query level (already scoped to the `user` model) the
    // shape is flat — `{ password: false }` — not `{ user: { password: ... } }`.
    omit: { password: false },

    include: {
      role: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });
};
