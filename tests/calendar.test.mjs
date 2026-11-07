import assert from "node:assert/strict";
import { test } from "node:test";
import { isDate, shiftDate, shiftMonth, monthWeeks, weekDates, visibleVisitCount } from "../lib/calendar.ts";
import { monthlyTripLanes } from "../lib/monthly-trips.ts";

test("week includes the selected Sunday across month and year boundaries", () => {
  assert.deepEqual(weekDates("2026-11-01"), ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]);
  assert.equal(weekDates("2027-01-01")[0], "2026-12-28");
  assert.equal(shiftDate("2024-02-28", 1), "2024-02-29");
  assert.equal(shiftDate("2026-10-26", -7), "2026-10-19");
});

test("invalid dates and dates outside the four-digit range cannot break week rendering", () => {
  for (const value of [undefined, "bad", "2026-02-29", "2026-13-01", ["2026-01-01"]]) assert.equal(isDate(value), false);
  assert.equal(weekDates("bad").length, 7);
  assert.equal(weekDates("0000-01-01").length, 7);
  assert.equal(weekDates("9999-12-31").length, 7);
  assert.equal(shiftDate("9999-12-31", 1), null);
});

test("capacity reserves dates and overflow access before adding place rows", () => {
  assert.equal(visibleVisitCount(70), 0);
  assert.equal(visibleVisitCount(92), 1);
  assert.equal(visibleVisitCount(122), 2);
  assert.equal(visibleVisitCount(600), 3);
  assert.equal(visibleVisitCount(122, 90, 60), 0);
});

test("month calendar covers leap years, six-week months and safe four-digit boundaries", () => {
  assert.equal(monthWeeks("2026-10-26").length, 5);
  assert.deepEqual(monthWeeks("2026-10-26")[4], weekDates("2026-10-26"));
  assert.equal(monthWeeks("2026-11-01").length, 6);
  assert.ok(monthWeeks("2024-02-01").flat().includes("2024-02-29"));
  assert.ok(!monthWeeks("2026-02-01").flat().includes("2026-02-29"));
  assert.equal(shiftMonth("2026-01-31", 1), "2026-02-01");
  assert.equal(shiftMonth("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftMonth("bad", 1), null);
  assert.equal(shiftMonth("0000-01-01", -1), null);
  assert.equal(shiftMonth("9999-12-01", 1), null);
  for (const date of ["0000-01-01", "9999-12-31", "bad"]) {
    const weeks = monthWeeks(date);
    assert.ok(weeks.every((week) => week.length === 7));
    assert.ok(weeks.flat().every((day) => day === null || isDate(day)));
  }
});

test("trip lanes preserve inclusive periods, stable continuation and access to excess trips", () => {
  const trip = (id, startsOn, endsOn) => ({ id, title: id, startsOn, endsOn, coverPhoto: null, companions: [] });
  const trips = [trip("long", "2026-10-25", "2026-11-03"), trip("second", "2026-10-26", "2026-10-29"), trip("third", "2026-10-29", "2026-10-29"), trip("reuse", "2026-10-30", "2026-10-31"), trip("outside", "2026-12-01", "2026-12-05")];
  const before = JSON.stringify(trips);
  const lanes = monthlyTripLanes(trips, "2026-10-26", "2026-11-01");
  assert.deepEqual(lanes.map(({ trip, lane }) => [trip.id, lane]), [["long", 0], ["second", 1], ["third", 2], ["reuse", 1]]);
  assert.equal(JSON.stringify(trips), before);
  assert.deepEqual(monthlyTripLanes([], "2026-10-26", "2026-11-01"), []);
  for (const { trip, lane } of lanes) {
    assert.ok(lanes.filter((other) => other.lane === lane && other.trip.id !== trip.id).every((other) => other.trip.endsOn < trip.startsOn || other.trip.startsOn > trip.endsOn));
  }
});
