import { getAllRemarks as getAllRemarksService } from "../services/service.getall.remark.js";

export const getAllRemarks = async (req, res) => {
  try {
    const take = Math.min(parseInt(req.query.limit) || 20, 100);
    const cursor = req.query.cursor || undefined;
    const case_id = req.query.case_id || undefined;

    const remarks = await getAllRemarksService({ take, cursor, case_id });
    const nextCursor =
      remarks.length === take ? remarks[remarks.length - 1].id : null;

    res.json({ success: true, data: remarks, nextCursor });
  } catch (error) {
    console.error("getAllRemarks error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch remarks" });
  }
};
