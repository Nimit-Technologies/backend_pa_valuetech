import prisma from "../../../prisma/client.js";

export const getStatusDependents = async (statusId) => {
    // Soft-deleted rows still physically exist and still block a hard delete
    // via the onDelete: Restrict FK, so they must not be filtered out here.
    const allocations = await prisma.allocation.findMany({
        where: { status_id: statusId },
        select: { id: true, case_id: true },
    });

    return { allocations };
};
