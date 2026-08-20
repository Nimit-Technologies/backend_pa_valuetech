import { getAllBusinessTypes as getAllBusinessTypesService } from "../services/service.getall.business-type.js";

export const getAllBusinessTypes = async (req, res) => {
  try {
    const { direction, cursorId } = req.query;
    const {
      businessTypes,
      businessTypeFirstId,
      businessTypeLastId,
      hasNextPage,
      hasPreviousPage,
      businessTypeLength,
      dataLimit,
    } = await getAllBusinessTypesService({ direction, cursorId });

    res.json({
      success: true,
      data: businessTypes,
      businessTypeFirstId,
      businessTypeLastId,
      hasNextPage,
      hasPreviousPage,
      businessTypeLength,
      dataLimit,
    });
  } catch (error) {
    console.error("getAllBusinessTypes error:", error);
    const status = error.status || 500;
    const message = error.status
      ? error.message
      : "Failed to fetch business types";
    res.status(status).json({ success: false, message });
  }
};
