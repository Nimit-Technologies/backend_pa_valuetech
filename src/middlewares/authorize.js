const ROLE = {
  SUPER_ADMIN: "super-admin",
  BRANCH_ADMIN: "branch-admin",
  COORDINATOR: "coordinator",
};

const DEPARTMENT = {
  COORDINATION: "coordination",
  MANAGEMENT: "management",
  TECHNICAL: "engineer",
  BACK_OFFICE: "back-office",
};

const deny = (res) =>
  res.status(403).json({
    success: false,
    message: "Access denied. You are not authorized.",
  });

// role.schema.js / department.schema.js already trim+lowercase `name` on
// create/update, so req.user.role.name should already be normalized by the
// time it's embedded in the JWT. Normalizing again here is just cheap
// insurance against a row ever reaching the DB outside that Zod schema
// (a seed script, a raw migration) — it can only make a match more
// permissive, never break one that already works.
const normalize = (value) => value?.trim().toLowerCase();

const hasRole = (req, ...roles) =>
  roles.includes(normalize(req.user?.role?.name));

const hasDepartment = (req, department) =>
  normalize(req.user?.department?.name) === department;

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
export const isCoordinator = (req, res, next) => {
  if (
    hasRole(req, ROLE.COORDINATOR) &&
    hasDepartment(req, DEPARTMENT.COORDINATION)
  ) {
    return next();
  }
  return deny(res);
};
