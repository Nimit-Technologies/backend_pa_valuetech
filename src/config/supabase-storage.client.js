import { createClient } from "@supabase/supabase-js";
import { CREDENTIALS } from "../constant/credentials.js";

// Built lazily, on first use, rather than at import time. uploads.routes.js is
// wired into the app unconditionally (see src/index.js), so importing this
// module must not crash server boot for every other feature just because
// Supabase Storage hasn't been configured yet — it should only fail when a
// request actually needs it. For the same reason these three are not in
// REQUIRED_ENV_VARS (src/config/env.config.js): that list's absence check
// runs at process startup and exits the whole process.
let client = null;

export const getSupabaseStorageClient = () => {
  if (client) return client;

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = CREDENTIALS;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase Storage is not configured — set SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env. The service role key is for " +
        "server-side use only: never send it to the frontend or log it.",
    );
  }

  // No session to persist — every call here is made as the service role on
  // behalf of whichever user the Express layer has already authenticated.
  client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
};

export const getCaseFilesBucket = () =>
  getSupabaseStorageClient().storage.from(CREDENTIALS.SUPABASE_STORAGE_BUCKET);
