import { deleteAllRemarks as deleteAllRemarksService } from "../services/service.delete.all.remark";

export const deleteAllRemarks = async (req, res) => {
  try {
    await deleteAllRemarksService();
    res.json({ success: true, message: "All remarks deleted successfully" });
  } catch (error) {
    console.error("deleteAllRemarks error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete remarks" });
  }
};
