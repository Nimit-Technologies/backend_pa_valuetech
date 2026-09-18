import { decryptStored } from "../../../utils/encryption.js";

// Shared by the admin update (PUT /user/update/:id) and self-service
// profile update (PUT /user/profile) controllers so both short-circuit a
// no-op submit the same way.
export const hasChanges = (existing, data) =>
  Object.entries(data).some(([key, value]) => {
    if (key === "password") return true;
    if (key === "confirm_password") return false;
    // `existing.aadhaar_number` is ciphertext — compare against the
    // decrypted value so an unchanged Aadhaar doesn't look like a change.
    if (key === "aadhaar_number") {
      return decryptStored(existing.aadhaar_number) !== value;
    }
    if (key === "address") {
      if (!value || typeof value !== "object") return false;
      return Object.entries(value).some(
        ([addrKey, addrValue]) => existing.address?.[addrKey] !== addrValue,
      );
    }
    if (key === "branch_id") return existing.branch?.id !== value;
    if (key === "department_id") return existing.department?.id !== value;
    if (key === "role_id") return existing.role?.id !== value;
    return existing[key] !== value;
  });
