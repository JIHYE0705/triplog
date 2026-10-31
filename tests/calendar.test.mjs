import assert from "node:assert/strict";
import { test } from "node:test";
import { isDate, shiftDate, weekDates, visibleVisitCount } from "../lib/calendar.ts";

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
