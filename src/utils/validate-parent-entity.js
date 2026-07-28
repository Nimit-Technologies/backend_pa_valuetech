/**
 * Checks a parent entity (branch/department/role) fetched by id and, if it is
 * missing or inactive/soft-deleted, writes the appropriate error response.
 * Returns true if a response was sent (caller must stop), false otherwise.
 */
export const respondIfInvalidParent = (res, entity, { label, action }) => {
  if (!entity) {
    res.status(404).json({ success: false, message: `${label} not found` });
    return true;
  }
  if (!entity.is_active || entity.deleted_at) {
    res.status(409).json({ success: false, message: `${label} is inactive or deleted; cannot ${action}` });
    return true;
  }
  return false;
};
