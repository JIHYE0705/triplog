import { createServerSupabaseClient } from "../lib/supabase/server.ts";

// This probe table is intentionally absent; its PostgREST error confirms API reachability without writes.
const { error } = await createServerSupabaseClient()
  .from("_triplog_connection_probe").select("*").limit(0).abortSignal(AbortSignal.timeout(10_000));
if (error && error.code !== "PGRST205") throw new Error(`Supabase connection failed: ${error.message}`);
console.log("Supabase Data API connection OK (read-only; no login or record storage tested)");
