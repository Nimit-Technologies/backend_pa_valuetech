// Who counts as an engineer when the engineer directory is queried.
//
// Both names must match rows that actually exist: roles and departments are
// created per branch by an admin and are free text, so these are the one place
// to change if the organisation renames either. They are compared
// case-insensitively, the way every guard in middlewares/authorize.js
// normalizes a role name before testing it.
//
// Note that middlewares/authorize.js has its own private DEPARTMENT map whose
// TECHNICAL entry reads "engineer". Nothing uses that entry (only CORDINATION
// is), and it does not match the seeded department, which is named "technical"
// — do not wire these two together without checking the data first.
export const ENGINEER_ROLE_NAME = "engineer";
export const TECHNICAL_DEPARTMENT_NAME = "technical";
