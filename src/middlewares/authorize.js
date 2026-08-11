const deny = (res) =>
  res.status(403).json({
    success: false,
    message: "Access denied. You are not authorized.",
  });

export const isSuperAdmin = (req, res, next) => {
  if (req.user?.role?.name === "super-admin") return next();
  return deny(res);
};
export const isAdmin = (req, res, next) => {
  if (
    req.user?.role?.name === "super-admin" ||
    req.user?.role?.name === "branch-admin"
  )
    return next();
  return deny(res);
};

export const isBranchAdmin = (req, res, next) => {
  if (req.user?.role?.name === "branch-admin") return next();
  return deny(res);
};

// Coordinator must have role "coordinator" AND belong to "coordination" department
export const isCoordinator = (req, res, next) => {
  const isRoleMatch = req.user?.role?.name === "coordinator";
  const isDeptMatch = req.user?.department?.name === "coordination";

  if (isRoleMatch && isDeptMatch) return next();
  return deny(res);
};
