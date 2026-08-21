import { remarkSchema } from "../remark.schema.js";
import { getUserById } from "../../users/services/service.getById.user.js";
import { createRemark as createRemarkService } from "../services/service.create.remark.js";

export const createRemark = async (req, res) => {
  try {
    const parsed = remarkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.issues });
    }
    const caseId = req.params.id;
    const { content, user_id } = parsed.data;

    // Snapshot the author's identity as of right now — a remark must keep
    // reading correctly even if the user/branch/department/role backing it
    // is later renamed, deactivated, or deleted.
    const author = await getUserById(user_id);
    if (!author) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const remark = await createRemarkService({
      content,
      user_id: author.id,
      case_id: caseId,
      branch_id: author.branch.id,
      department_id: author.department.id,
      role_id: author.role.id,
      first_name: author.first_name,
      employee_id: author.employee_id,
      branch_name: author.branch.name,
      department_name: author.department.name,
      role_name: author.role.name,
    });

    res.status(201).json({ success: true, data: remark });
  } catch (error) {
    console.error("createRemark error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create remark" });
  }
};
