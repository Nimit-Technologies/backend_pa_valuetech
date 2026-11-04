import { z } from "zod";

// Mirrors the PhotoType enum in prisma/schema/asset.prisma — kept as a plain
// list here (not imported from the generated client) for the same reason
// engineer.report.js's step ENUMS are hand-duplicated rather than imported:
// this schema must stay loadable without touching Prisma/the database.
export const PHOTO_TYPES = [
  "RoadApproachPhoto",
  "OutsidePhoto",
  "NamePlatePhoto",
  "MeterPhoto",
  "SelfiePhoto",
  "AdditionalPhoto",
];

// 5 required categories + generous headroom for additional photos (the
// frontend caps its "Add More Photo" slots well under this).
const MAX_ASSETS_PER_TASK = 40;

// Cheap sanity check, not a security boundary: confirms the client is
// pointing at *some* Supabase Storage public object, not that this uploader
// actually owns it or that it belongs to this task. The upload itself is
// authorized by Supabase's own RLS on the bucket, not this API — see the
// comment on the Asset model.
const isSupabasePublicObjectUrl = (value) => {
  try {
    const url = new URL(value);
    return (
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.includes("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
};

const assetSchema = z
  .object({
    photoType: z.enum(PHOTO_TYPES),
    objectUrl: z
      .string()
      .url()
      .max(2000)
      .refine(
        isSupabasePublicObjectUrl,
        "objectUrl must be a Supabase Storage public object URL",
      ),
    objectID: z.string().min(1).max(500),
    objectName: z.string().min(1).max(500),
  })
  .strict();

export const saveAssetsSchema = z
  .object({
    assets: z.array(assetSchema).max(MAX_ASSETS_PER_TASK),
  })
  .strict();
