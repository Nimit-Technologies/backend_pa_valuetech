export const ROLE = {
  SUPER_ADMIN: "super admin",
  BRANCH_ADMIN: "branch admin",
  CORDINATOR: "cordinator",
};

const DEPARTMENT = {
  CORDINATION: "cordination",
  MANAGEMENT: "management",
  TECHNICAL: "engineer",
  BACK_OFFICE: "back office",
};

const deny = (res) =>
  res.status(403).json({
    success: false,
    message: "Access denied. You are not authorized.",
  });

const normalize = (value) => value?.trim().toLowerCase();

const hasRole = (req, ...roles) =>
  roles.includes(normalize(req.user?.role?.name));

const hasDepartment = (req, department) =>
  normalize(req.user?.department?.name) === department;

export const isSuperAdminRole = (req) => hasRole(req, ROLE.SUPER_ADMIN);

export const isSuperAdmin = (req, res, next) => {
  if (hasRole(req, ROLE.SUPER_ADMIN)) return next();
  return deny(res);
};

export const isAdmin = (req, res, next) => {
  if (hasRole(req, ROLE.SUPER_ADMIN, ROLE.BRANCH_ADMIN)) return next();
  return deny(res);
};

export const isBranchAdmin = (req, res, next) => {
  if (hasRole(req, ROLE.BRANCH_ADMIN)) return next();
  return deny(res);
};

// Coordinator must have role "coordinator" AND belong to "coordination" department
const isCoordinatorUser = (req) =>
  hasRole(req, ROLE.CORDINATOR) && hasDepartment(req, DEPARTMENT.CORDINATION);

export const isCoordinator = (req, res, next) => {
  if (isCoordinatorUser(req)) return next();
  return deny(res);
};

export const isBranchAdminOrCoordinator = (req, res, next) => {
  if (hasRole(req, ROLE.BRANCH_ADMIN) || isCoordinatorUser(req)) return next();
  return deny(res);
};
