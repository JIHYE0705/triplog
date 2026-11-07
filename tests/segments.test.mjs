import assert from "node:assert/strict";
import { test } from "node:test";
import { localInstants, parseTravelSegments, reorderSegment, segmentInputError } from "../lib/travel-segments.ts";
import { canDeleteDemoTrip, demoTravelSegments, outsideTripCount } from "../lib/demo-trips.ts";

test("local times resolve using the actual endpoint zone including half-hour DST gaps and overlaps", () => {
  assert.deepEqual(localInstants("2026-10-26T08:00", "Asia/Seoul"), ["2026-10-25T23:00:00.000Z"]);
  assert.deepEqual(localInstants("2026-03-08T02:30", "America/New_York"), []);
  assert.deepEqual(localInstants("2026-11-01T01:30", "America/New_York"), ["2026-11-01T05:30:00.000Z", "2026-11-01T06:30:00.000Z"]);
  assert.deepEqual(localInstants("2026-04-05T01:45", "Australia/Lord_Howe"), ["2026-04-04T14:45:00.000Z", "2026-04-04T15:15:00.000Z"]);
  assert.deepEqual(localInstants("2026-10-04T02:15", "Australia/Lord_Howe"), []);
  assert.deepEqual(localInstants("2011-12-30T12:00", "Pacific/Apia"), []);
  for (const [local, zone] of [["2026-02-30T10:00", "UTC"], ["2026-01-01T24:00", "UTC"], ["bad", "UTC"], ["2026-01-01T12:00", "invalid-zone"], ["2026-01-01T12:00", ""]]) assert.deepEqual(localInstants(local, zone), []);
});

test("date-line journeys preserve local dates while comparing actual instants", () => {
  const base = demoTravelSegments[0];
  const segment = { ...base, departureLocal: "2026-10-26T20:00", departureZone: "Asia/Tokyo", departureUtc: "2026-10-26T11:00:00.000Z", arrivalLocal: "2026-10-26T13:00", arrivalZone: "America/Los_Angeles", arrivalUtc: "2026-10-26T20:00:00.000Z" };
  assert.equal(segmentInputError(segment), null);
  assert.ok(segmentInputError({ ...segment, arrivalLocal: "2026-10-26T03:00", arrivalUtc: "2026-10-26T10:00:00.000Z" }).includes("빠를 수"));
  const overnight = { ...base, departureLocal: "2026-10-26T23:50", departureUtc: "2026-10-26T14:50:00.000Z", arrivalLocal: "2026-10-27T00:20", arrivalUtc: "2026-10-26T15:20:00.000Z" };
  assert.equal(segmentInputError(overnight), null);
  const overlap = { ...base, departureLocal: "2026-11-01T01:30", departureZone: "America/New_York", departureUtc: "", arrivalLocal: "2026-11-01T03:00", arrivalZone: "America/New_York", arrivalUtc: "2026-11-01T08:00:00.000Z" };
  assert.ok(segmentInputError(overlap));
  assert.equal(segmentInputError({ ...overlap, departureUtc: "2026-11-01T06:30:00.000Z" }), null);
});

test("stored segments reject corrupt IDs, foreign shapes and invalid time choices without changing existing records", () => {
  const original = JSON.stringify(demoTravelSegments);
  assert.deepEqual(parseTravelSegments(original), demoTravelSegments);
  assert.deepEqual(parseTravelSegments("[]"), []);
  for (const raw of ["null", "{}", "broken", JSON.stringify([demoTravelSegments[0], demoTravelSegments[0]])]) assert.throws(() => parseTravelSegments(raw));
  for (const invalid of [{ id: "../bad" }, { tripId: "../bad" }, { mode: "bus" }, { operator: null }, { service: "a".repeat(101) }, { departure: " " }, { arrival: null }, { departureUtc: "2026-10-25T22:00:00.000Z" }, { departureZone: "" }, { arrivalLocal: "2026-02-30T10:00" }]) assert.throws(() => parseTravelSegments(JSON.stringify([{ ...demoTravelSegments[0], ...invalid }])));
  assert.equal(JSON.stringify(demoTravelSegments), original);
});

test("manual order stays within each trip and edited segments drive range warnings and deletion guards", () => {
  const first = { ...demoTravelSegments[0], id: "first", tripId: "a" };
  const other = { ...demoTravelSegments[0], id: "other", tripId: "b" };
  const last = { ...demoTravelSegments[1], id: "last", tripId: "a" };
  const source = [first, other, last];
  assert.deepEqual(reorderSegment(source, "last", -1), [last, other, first]);
  assert.deepEqual(source, [first, other, last]);
  assert.equal(reorderSegment(source, "first", -1), source);
  assert.equal(reorderSegment(source, "missing", 1), source);
  assert.equal(canDeleteDemoTrip("a", {}, source), false);
  assert.equal(canDeleteDemoTrip("a", {}, [other]), true);
  assert.equal(outsideTripCount({ id: "a", startsOn: "2026-10-26", endsOn: "2026-10-31" }, {}, source), 1);
});
