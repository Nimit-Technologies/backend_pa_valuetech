import { CREDENTIALS } from "../../../constant/credentials.js";
import { PAGINATION_DIRECTION } from "../../../constant/pagination.js";
import prisma from "../../../prisma/client.js";
import { branchSelect } from "./department.service.helpers.js";

const VALID_DIRECTIONS = Object.values(PAGINATION_DIRECTION);

export const getAllDepartments = async (query) => {
  const dataLimit = parseInt(`${CREDENTIALS.DATA_LIMIT}`);
  const direction = String(query.direction || PAGINATION_DIRECTION.NEXT);
  const cursorId = String(query.cursorId || "");

  if (!VALID_DIRECTIONS.includes(direction)) {
    const error = new Error(
      `Invalid direction "${direction}". Expected "${PAGINATION_DIRECTION.NEXT}" or "${PAGINATION_DIRECTION.PREVIOUS}".`,
    );
    error.status = 400;
    throw error;
  }

  const filter = { deleted_at: null };
  let orderBy = { id: "asc" };

  if (cursorId) {
    if (direction === PAGINATION_DIRECTION.NEXT) {
      filter.id = { gt: cursorId };
    } else if (direction === PAGINATION_DIRECTION.PREVIOUS) {
      filter.id = { lt: cursorId };
      orderBy = { id: "desc" };
    }
  }
  const initialDepartments = await prisma.department.findMany({
    where: filter,
    orderBy,
    take: dataLimit + 1,
    include: { branch: branchSelect },
  });

  if (!initialDepartments.length) {
    return {
      departments: [],
      departmentFirstId: null,
      departmentLastId: null,
      hasNextPage: false,
      hasPreviousPage: false,
      departmentLength: 0,
      dataLimit,
    };
  }

  const hasMore = initialDepartments.length > dataLimit;
  if (hasMore) initialDepartments.pop();

  const finalDepartments =
    direction === PAGINATION_DIRECTION.PREVIOUS
      ? initialDepartments.reverse()
      : initialDepartments;

  return {
    departments: finalDepartments,
    departmentFirstId: finalDepartments[0]?.id,
    departmentLastId: finalDepartments[finalDepartments.length - 1]?.id,
    hasNextPage: direction === PAGINATION_DIRECTION.NEXT ? hasMore : !!cursorId,

    hasPreviousPage:
      direction === PAGINATION_DIRECTION.PREVIOUS ? hasMore : !!cursorId,

    departmentLength: finalDepartments.length,
    dataLimit,
  };
};
