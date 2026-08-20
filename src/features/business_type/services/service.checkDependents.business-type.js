import prisma from "../../../prisma/client.js";

export const getBusinessTypeDependents = async (businessTypeId) => {
    // Soft-deleted rows still physically exist and still block a hard delete
    // via the onDelete: Restrict FK, so they must not be filtered out here.
    const allocations = await prisma.allocation.findMany({
        where: { business_type_id: businessTypeId },
        select: { id: true, case_id: true },
    });

    return { allocations };
};
