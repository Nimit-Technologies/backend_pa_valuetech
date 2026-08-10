// Lets the frontend confirm that a persisted "logged in" state (e.g. Redux
// state restored from localStorage after reopening a tab) is still backed by
// a valid httpOnly session cookie, rather than trusting the client's memory
// of its own auth state. `isAuthenticated` has already verified the token
// and set req.user by the time this runs, so this is a pure echo — no DB hit.
export const session = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Session is valid",
    data: req.user,
  });
};
