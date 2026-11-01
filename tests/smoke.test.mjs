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
  for (const [path, title] of [["/", "다이어리"], ["/trips", "여행"], ["/map", "지도"]]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /lang="ko"/);
    assert.ok(html.includes(title));
    assert.match(html, /실제 기록의 서버 저장은 아직 지원하지 않아요/);
    const current = html.match(/<a\b[^>]*aria-current="page"[^>]*>/g);
    assert.equal(current?.length, 1);
    assert.ok(current[0].includes(`href="${path}"`));
    assert.match(html, /rel="manifest"/);
    assert.match(html, /viewport-fit=cover/);
  }
});

test("trip routes keep the trip menu active and expose a hydration loading state", async () => {
  for (const path of ["/trips/new", "/trips/kyoto-autumn", "/trips/kyoto-autumn/edit", "/trips/unknown-trip"]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /가상 여행을 불러오는 중/);
    const current = html.match(/<a\b[^>]*aria-current="page"[^>]*>/g);
    assert.equal(current?.length, 1);
    assert.ok(current[0].includes('href="/trips"'));
  }
  const map = await (await fetch(`${origin}/map?trip=kyoto-autumn`)).text();
  assert.match(map, /가상 여행을 불러오는 중/);
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

test("week links keep all seven days across a month boundary and handle empty weeks", async () => {
  const html = await (await fetch(`${origin}/?week=2026-11-01`)).text();
  assert.equal((html.match(/class="week-day"/g) ?? []).length, 7);
  assert.match(html, /href="\/diary\/2026-10-26"/);
  assert.match(html, /href="\/diary\/2026-11-01"/);
  assert.match(html, /\+5개/);
  const empty = await (await fetch(`${origin}/?week=2026-11-02`)).text();
  assert.match(empty, /비어 있는 한 주/);
  const invalid = await (await fetch(`${origin}/?week=2026-02-30`)).text();
  assert.match(invalid, /href="\/diary\/2026-10-26"/);
});

test("daily page exposes every overflow visit, full place names, diary and return week", async () => {
  const response = await fetch(`${origin}/diary/2026-10-26`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /숙소 앞 작은 공원/);
  assert.match(html, /새로운 동네에서 시작한 한 주/);
  assert.match(html, /href="\/\?week=2026-10-26"/);
  const long = await (await fetch(`${origin}/diary/2026-10-29`)).text();
  assert.match(long, /아주 긴 이름을 가진 골목 안의 작은 여행 기념품 가게/);
  const diaryOnly = await (await fetch(`${origin}/diary/2026-10-28`)).text();
  assert.match(diaryOnly, /오늘은 숙소에서 쉬었다/);
  for (const date of ["2026-02-30", "not-a-date"]) assert.equal((await fetch(`${origin}/diary/${date}`)).status, 404);
});
