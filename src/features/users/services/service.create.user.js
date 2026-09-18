import prisma from "../../../prisma/client.js";
import { recordUserTransition } from "../utils/user-count.js";

const relationSelect = { select: { id: true, name: true } };

export const createUser = async (data, historyEntry) => {
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

  const user = await prisma.user.create({
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
    select: {
      id: true,
      employee_id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      aadhaar_number: true,
      is_active: true,
      history: true,
      branch: relationSelect,
      department: relationSelect,
      role: relationSelect,
      address: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  recordUserTransition(null, user);
  return user;
};
