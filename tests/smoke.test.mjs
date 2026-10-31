import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";
import { once } from "node:events";

let server;
let origin;

before(async () => {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "0"], {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error(`Server did not start: ${output}`)), 30000);
    server.on("error", reject);
    server.on("exit", (code) => { clearTimeout(timeout); reject(new Error(`Server exited (${code}): ${output}`)); });
    const read = (chunk) => {
      output += chunk.toString();
      const url = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (url && /Ready in/.test(output)) {
        origin = url[0];
        clearTimeout(timeout);
        resolve();
      }
    };
    server.stdout.on("data", read);
    server.stderr.on("data", read);
  });
});

after(async () => {
  if (server && server.exitCode === null) {
    const exited = once(server, "exit");
    server.kill();
    await exited;
  }
});

test("all three pages render Korean navigation and an honest setup state", async () => {
  for (const [path, title] of [["/", "나의 다이어리"], ["/trips", "나의 여행"], ["/map", "나의 지도"]]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /lang="ko"/);
    assert.ok(html.includes(title));
    assert.match(html, /아직 기록을 저장할 수 없어요/);
    const current = html.match(/<a\b[^>]*aria-current="page"[^>]*>/g);
    assert.equal(current?.length, 1);
    assert.ok(current[0].includes(`href="${path}"`));
    assert.match(html, /rel="manifest"/);
    assert.match(html, /viewport-fit=cover/);
  }
});

test("manifest and every install icon are served with their expected type", async () => {
  const response = await fetch(`${origin}/manifest.webmanifest`);
  assert.equal(response.status, 200);
  const manifest = await response.json();
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.theme_color, "#FAF8F4");
  for (const src of [...manifest.icons.map((icon) => icon.src), "/apple-icon.png"]) {
    const icon = await fetch(`${origin}${src}`);
    assert.equal(icon.status, 200);
    assert.match(icon.headers.get("content-type"), /image\/png/);
    assert.deepEqual([...new Uint8Array(await icon.arrayBuffer()).slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }
});

test("unknown routes return 404", async () => {
  assert.equal((await fetch(`${origin}/missing-page`)).status, 404);
});
