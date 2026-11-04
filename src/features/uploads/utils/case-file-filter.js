import { ALLOWED_MIME_TYPES } from "./storage-key.js";

// Kept out of uploads.routes.js on purpose: that file imports isAuthenticated,
// which imports the Prisma client, which connects to the database as a side
// effect of being imported (see src/prisma/client.js) — fine for the running
// app, but it would mean a plain unit test of this filter, imported the
// obvious way, silently depended on a live database connection to even load.
export const caseFileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error(`Unsupported file type: ${file.mimetype}`);
    error.statusCode = 400;
    return cb(error);
  }
  cb(null, true);
};
