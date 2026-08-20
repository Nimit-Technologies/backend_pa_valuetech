export const TOKEN_TTL_SECONDS = 24 * 60 * 60;

// Single source of truth for the "token" auth cookie's attributes. Every
// res.cookie("token", ...) / res.clearCookie("token", ...) call site should
// import this instead of redefining it locally — a mismatch between the
// options used to set vs. clear the cookie (or between different set sites)
// is a classic silent bug (cookie doesn't clear, or behaves differently
// depending on which code path issued it).
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: TOKEN_TTL_SECONDS * 1000,
  path: "/",
};
