import assert from "node:assert/strict";
import { test } from "node:test";
import { demoEntries } from "../lib/demo-diary.ts";
import { parseDiaryEntries, putVisit, reorderVisit, visitInputError } from "../lib/diary.ts";
import { canDeleteDemoTrip, linkedTripDates, outsideTripCount } from "../lib/demo-trips.ts";

test("three untimed visits keep their individual notes, manual order and separate diary", () => {
  const date = "2024-02-29";
  let entries = { [date]: { diary: "하루 전체 일기", visits: [], tripIds: [] } };
  for (const [id, place, note] of [["cafe", "카페", "창가 자리"], ["walk", "산책길", "느긋한 오후"], ["book", "서점", "책 한 권"]]) {
    entries = putVisit(entries, null, date, { id, place, note });
  }
  const reordered = reorderVisit(entries[date], "book", -1);
  assert.deepEqual(reordered.visits.map((visit) => visit.id), ["cafe", "book", "walk"]);
  assert.deepEqual(entries[date].visits.map((visit) => visit.id), ["cafe", "walk", "book"], "reorder must not mutate source");
  entries[date] = reordered;
  const changed = putVisit(entries, date, date, { ...reordered.visits[0], note: "수정한 장소 소감" });
  assert.equal(changed[date].diary, "하루 전체 일기");
  assert.equal(changed[date].visits[0].note, "수정한 장소 소감");
  changed[date].visits = changed[date].visits.filter((visit) => visit.id !== "book");
  assert.equal(changed[date].diary, "하루 전체 일기");
  assert.deepEqual(parseDiaryEntries(JSON.stringify(changed)), changed);
  assert.deepEqual(parseDiaryEntries('{"2024-02-29":{"diary":"장소 없는 날","visits":[],"tripIds":[]}}')[date].visits, []);
});

test("moving an overseas visit preserves photo, local time, diary and explicit trip links", () => {
  const original = JSON.stringify(demoEntries);
  const visit = demoEntries["2026-10-26"].visits[0];
  const entries = putVisit(demoEntries, "2026-10-26", "2026-11-04", visit);
  assert.equal(entries["2026-10-26"].visits.length, 4);
  assert.equal(entries["2026-10-26"].diary, demoEntries["2026-10-26"].diary);
  assert.deepEqual(entries["2026-11-04"].visits[0], visit);
  assert.deepEqual(entries["2026-11-04"].tripIds, ["kyoto-autumn"]);
  assert.equal(entries["2026-11-04"].visits[0].timeZone, "Asia/Tokyo");
  assert.ok(linkedTripDates("kyoto-autumn", entries).includes("2026-11-04"));
  assert.equal(JSON.stringify(demoEntries), original);
  for (const timeZone of ["Asia/Seoul", "America/Los_Angeles", "Pacific/Honolulu"]) {
    assert.equal(visitInputError("2026-11-04", { ...visit, timeZone }), null);
    assert.ok(Object.keys(parseDiaryEntries(JSON.stringify(entries))).includes("2026-11-04"));
  }
  assert.throws(() => putVisit(entries, "2026-11-05", "2026-11-06", visit));
});

test("storage rejects corrupt structures, duplicate visit IDs, invalid dates, times, zones and photos", () => {
  const entry = demoEntries["2026-10-26"];
  const visit = entry.visits[0];
  assert.deepEqual(parseDiaryEntries(JSON.stringify(demoEntries)), demoEntries);
  assert.deepEqual(parseDiaryEntries("{}"), {});
  for (const data of ["null", "[]", "broken", '{"__proto__":{}}', JSON.stringify({ "2026-02-30": entry }), JSON.stringify({ "2026-10-26": { ...entry, tripIds: ["kyoto-autumn", "kyoto-autumn"] } })]) assert.throws(() => parseDiaryEntries(data));
  for (const invalid of [{ id: "../escape" }, { place: "  " }, { note: null }, { time: "24:00" }, { time: "10:60" }, { timeZone: "not-a-zone" }, { timeZone: undefined }, { time: undefined }, { tripId: "not-linked" }, { photo: "https://example.com/private.jpg" }]) {
    assert.throws(() => parseDiaryEntries(JSON.stringify({ "2026-10-26": { ...entry, visits: [{ ...visit, ...invalid }] } })));
  }
  assert.throws(() => parseDiaryEntries(JSON.stringify({ "2026-10-26": entry, "2026-10-27": entry })));
  assert.equal(visitInputError("2026-10-26", { ...visit, time: undefined, timeZone: undefined }), null);
});

test("daily multi-trip links drive trip details and deletion guards without inferring by date", () => {
  const entries = { "2026-11-03": { diary: "두 여행이 겹친 하루", tripIds: ["first", "second"], visits: [{ id: "one", place: "역", note: "환승", tripId: "second" }] } };
  const parsed = parseDiaryEntries(JSON.stringify(entries));
  assert.deepEqual(linkedTripDates("first", parsed), ["2026-11-03"]);
  assert.deepEqual(linkedTripDates("second", parsed), ["2026-11-03"]);
  assert.deepEqual(linkedTripDates("unlinked", parsed), []);
  assert.equal(canDeleteDemoTrip("second", parsed), false);
  assert.equal(canDeleteDemoTrip("unlinked", parsed), true);
  assert.equal(outsideTripCount({ id: "second", startsOn: "2026-11-01", endsOn: "2026-11-02" }, parsed), 1);
  assert.deepEqual(reorderVisit(parsed["2026-11-03"], "one", -1), parsed["2026-11-03"]);
});
