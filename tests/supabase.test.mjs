import assert from "node:assert/strict";
import { execFile, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { promisify } from "node:util";
import { test } from "node:test";

test("Supabase client requires both environment values and starts without a session", () => {
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--input-type=module", "-e", `
    import assert from 'node:assert/strict';
    import { createServerSupabaseClient } from './lib/supabase/server.ts';
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    assert.throws(createServerSupabaseClient, /not configured/);
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    assert.throws(createServerSupabaseClient, /not configured/);
    process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    const client = createServerSupabaseClient();
    const { data, error } = await client.auth.getSession();
    assert.ifError(error);
    assert.equal(data.session, null);
  `], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("connection probe accepts a missing table but rejects a denied key", async () => {
  let status = 404;
  const server = createServer((request, response) => {
    assert.equal(request.method, "GET");
    assert.equal(new URL(request.url, "http://fixture").searchParams.get("limit"), "0");
    assert.equal(request.headers.apikey, "sb_publishable_test");
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(status === 404
      ? { code: "PGRST205", message: "Table not found" }
      : { code: "PGRST301", message: "Invalid API key" }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const run = () => promisify(execFile)(process.execPath,
    ["--conditions=react-server", "scripts/check-supabase.mjs"], {
      env: { ...process.env, SUPABASE_URL: `http://127.0.0.1:${server.address().port}`, SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" },
    });
  try {
    assert.match((await run()).stdout, /connection OK/);
    status = 401;
    await assert.rejects(run, /Supabase connection failed: Invalid API key/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
