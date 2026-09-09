import prisma from "../../../prisma/client.js";

export const createUser = (data, historyEntry) => {
  const {
    employee_id,
    first_name,
    last_name,
    email,
    phone,
    password,
    aadhaar_number, // already encrypted by the controller
    aadhaar_hash, // blind index of the plaintext Aadhaar
    branch_id,
    department_id,
    role_id,
    address,
  } = data;

  return prisma.user.create({
    data: {
      employee_id,
      first_name,
      last_name,
      email: email ?? null, // optional — store null when not provided
      phone,
      password,
      aadhaar_number,
      aadhaar_hash,
      history: historyEntry ? [historyEntry] : [],
      branch: { connect: { id: branch_id } },
      department: { connect: { id: department_id } },
      role: { connect: { id: role_id } },
      address: { create: address },
    },
  });
};
