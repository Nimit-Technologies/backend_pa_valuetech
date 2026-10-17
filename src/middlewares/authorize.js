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

export const isBranchAdminRole = (req) => hasRole(req, ROLE.BRANCH_ADMIN);

// The normalized role name, for rules that are keyed by role rather than
// gated by it — see constant/case-transitions.js. Role rows are per-department
// and therefore per-branch, so the name is the only branch-independent handle.
export const roleName = (req) => normalize(req.user?.role?.name);

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

// Reading *someone else's* row stays admin-only; reading your own never was an
// admin action. The self-service profile pages (view profile / manage profile)
// are the only reason a coordinator or engineer calls GET /user/:id, and they
// only ever pass their own id. This widens nothing else: a non-admin still
// cannot name another id, and the branch scope in the controller still applies.
export const isAdminOrSelf = (req, res, next) => {
  if (req.params?.id && req.params.id === req.user?.id) return next();
  return isAdmin(req, res, next);
};

// Coordinator must have role "coordinator" AND belong to "coordination" department
const isCoordinatorUser = (req) =>
  hasRole(req, ROLE.CORDINATOR) && hasDepartment(req, DEPARTMENT.CORDINATION);

export const isCoordinatorRole = isCoordinatorUser;

export const isCoordinator = (req, res, next) => {
  if (isCoordinatorUser(req)) return next();
  return deny(res);
};

export const isBranchAdminOrCoordinator = (req, res, next) => {
  if (hasRole(req, ROLE.BRANCH_ADMIN) || isCoordinatorUser(req)) return next();
  return deny(res);
};
