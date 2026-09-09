const CUID_REGEX = /^c[a-z0-9]{24}$/;

export const isValidCuid = (id) => {
  return typeof id === "string" && CUID_REGEX.test(id);
};

const PLAUSIBLE_ID_REGEX = /^[a-z0-9]{20,30}$/;

export const looksLikeAnId = (id) => {
  return typeof id === "string" && PLAUSIBLE_ID_REGEX.test(id);
};
