import { developerDeleteCase as developerDeleteCaseService } from "../services/service.developerDelete.case.js";

export const developerDeleteCase = async (req, res) => {
  try {
    const { id } = req.params;

    const caseRecord = await developerDeleteCaseService(id);

    res.json({
      success: true,
      message: "Case hard-deleted successfully",
      data: { id: caseRecord.id, file_number: caseRecord.file_number },
    });
  } catch (error) {
    // P2025 covers both a wrong id and an already-deleted one. The id is not
    // validated up front: a malformed cuid simply lands here as a 404.
    if (error?.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    console.error("developerDeleteCase error:", error);
    res.status(500).json({ success: false, message: "Failed to delete case" });
  }
};
