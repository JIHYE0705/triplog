import assert from "node:assert/strict";
import { test } from "node:test";
import { canDeleteDemoTrip, demoTrips, demoTripDates, demoTravelSegments, filterDemoTrips, outsideTripCount, overlapsPeriod, parseDemoTrips, tripInputError } from "../lib/demo-trips.ts";
import { demoEntries } from "../lib/demo-diary.ts";

test("trip input accepts past/same-day trips, optional names and duplicate companion names", () => {
  const trip = { ...demoTrips[0], startsOn: "2024-02-29", endsOn: "2024-02-29", companions: [] };
  assert.equal(tripInputError(trip), null);
  assert.equal(tripInputError({ ...trip, companions: ["지수", "지수"] }), null);
  for (const invalid of [{ title: "   " }, { startsOn: "2026-02-29" }, { endsOn: "2024-02-28" }, { coverPhoto: "https://example.com/private.jpg" }, { companions: ["  "] }]) {
    assert.equal(typeof tripInputError({ ...trip, ...invalid }), "string");
  }
});

test("storage data validates every trip, duplicate IDs and unexpected photo sources before use", () => {
  const raw = JSON.stringify(demoTrips);
  assert.deepEqual(parseDemoTrips(raw), demoTrips);
  assert.deepEqual(parseDemoTrips("[]"), []);
  for (const data of ["null", "{}", "broken", JSON.stringify([demoTrips[0], demoTrips[0]]), JSON.stringify([{ ...demoTrips[0], companions: [null] }]), JSON.stringify([{ ...demoTrips[0], id: "../new" }]), JSON.stringify([{ ...demoTrips[0], coverPhoto: "javascript:alert(1)" }]), JSON.stringify([{ ...demoTrips[0], endsOn: "invalid" }])]) {
    assert.throws(() => parseDemoTrips(data));
  }
});

test("period lookup includes both boundaries, partial overlaps and open-ended filters", () => {
  assert.equal(overlapsPeriod("2026-10-26", "2026-11-01", "2026-11-01", "2026-11-04"), true);
  assert.equal(overlapsPeriod("2026-10-26", "2026-11-01", "2026-10-27", "2026-10-28"), true);
  assert.equal(overlapsPeriod("2026-10-26", "2026-11-01", "2026-11-02", ""), false);
  assert.equal(overlapsPeriod("2026-10-26", "2026-11-01", "", "2026-10-25"), false);
  assert.equal(overlapsPeriod("2026-10-26", "2026-11-01", "", ""), true);
});

test("title, inclusive period and companion filters combine and keep source order intact", () => {
  const source = [demoTrips[1], demoTrips[0], { ...demoTrips[1], id: "another-trip", title: "Autumn walk", companions: ["지수"] }];
  assert.deepEqual(filterDemoTrips(source, " 교토 ", "2026-11-01", "2026-11-04", "지수").map((trip) => trip.id), ["kyoto-autumn"]);
  assert.deepEqual(filterDemoTrips(source, "교토", "", "", "없는 이름"), []);
  assert.deepEqual(filterDemoTrips(source, "AUTUMN", "", "", "지수").map((trip) => trip.id), ["another-trip"]);
  assert.equal(filterDemoTrips(source, "", "", "", "지수").length, 2);
  assert.equal(filterDemoTrips(source, "", "", "", "")[0].id, "kyoto-autumn");
  assert.equal(source[0].id, "busan-weekend");
});

test("shrinking a trip counts out-of-range days and transport without altering records or photo", () => {
  const before = JSON.stringify({ demoTrips, demoTripDates, demoTravelSegments });
  assert.equal(outsideTripCount(demoTrips[0], demoEntries), 0);
  const changed = { ...demoTrips[0], startsOn: "2026-10-28", endsOn: "2026-10-29" };
  assert.equal(outsideTripCount(changed, demoEntries), 6);
  assert.equal(changed.coverPhoto, demoTrips[0].coverPhoto);
  assert.equal(JSON.stringify({ demoTrips, demoTripDates, demoTravelSegments }), before);
  assert.equal(demoTripDates["new-trip"], undefined, "matching dates must not create implicit trip links");
  assert.equal(canDeleteDemoTrip(changed.id, demoEntries), false);
  assert.equal(canDeleteDemoTrip("new-trip", demoEntries), true);
});
