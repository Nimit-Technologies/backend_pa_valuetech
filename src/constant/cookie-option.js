export const TOKEN_TTL_SECONDS = 24 * 60 * 60;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: TOKEN_TTL_SECONDS * 1000,
  path: "/",
};
