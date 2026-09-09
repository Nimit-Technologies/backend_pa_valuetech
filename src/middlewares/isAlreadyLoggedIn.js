import jwt from "jsonwebtoken";
import { CREDENTIALS } from "../constant/credentials.js";
import { COOKIE_OPTIONS } from "../constant/cookie-option.js";
import prisma from "../prisma/client.js";
import { toAuthUser } from "../features/auth/auth.serializer.js";

export const isAlreadyLoggedIn = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, CREDENTIALS.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // A signature-valid, unexpired token is NOT enough to declare the caller
    // "already logged in": it may have been revoked (logout / a privilege
    // change bumps token_version) or the account may have been deactivated
    // since it was issued. Mirror isAuthenticated's DB checks so this
    // endpoint can't hand back an identity that every other route would
    // immediately 401 — fall through to the login flow instead.
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { is_active: true, deleted_at: true, token_version: true },
    });

    const sessionIsLive =
      currentUser &&
      currentUser.is_active &&
      !currentUser.deleted_at &&
      currentUser.token_version === decoded.token_version;

    if (!sessionIsLive) {
      res.clearCookie("token", COOKIE_OPTIONS);
      return next();
    }

    return res.status(200).json({
      success: true,
      message: "Already logged in",
      data: toAuthUser(decoded),
    });
  } catch {
    res.clearCookie("token", COOKIE_OPTIONS);
    return next();
  }
};
