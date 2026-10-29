import test from "node:test";
import assert from "node:assert/strict";

import { formatDateTime } from "../src/utils/format-date-time.js";

// formatDateTime produces the "YYYY-MM-DD HH:mm:ss" string that goes into every
// history entry and formatted response. It used to read the server's clock
// through getHours()/getDate(), which made its output depend on the container's
// timezone: correct on an IST dev machine, 5h30m out on the UTC production
// container, and silently so, because the string carries no timezone marker.
//
// These assertions pin the instant → string mapping, so the output cannot start
// tracking the host's timezone again. They pass regardless of the TZ the test
// runner itself is started with, which is the whole point.

test("formats a UTC instant in IST, not in the host timezone", () => {
  // 05:00 UTC is 10:30 IST on the same day.
  assert.equal(
    formatDateTime(new Date("2026-01-15T05:00:00.000Z")),
    "2026-01-15 10:30:00",
  );
});

test("carries the +05:30 offset across a date boundary", () => {
  // 19:00 UTC on the 14th is 00:30 IST on the 15th. This is the case that
  // actually catches a regression: a host-timezone implementation running UTC
  // would report the 14th, dating the event a day early.
  assert.equal(
    formatDateTime(new Date("2026-01-14T19:00:00.000Z")),
    "2026-01-15 00:30:00",
  );
});

test("renders midnight as 00, never 24", () => {
  // 18:30 UTC is exactly 00:00 IST the next day. Some ICU versions render this
  // hour as "24" under hour12: false, which is why the formatter asks for
  // hourCycle: "h23" instead.
  assert.equal(
    formatDateTime(new Date("2026-01-14T18:30:00.000Z")),
    "2026-01-15 00:00:00",
  );
});

test("pads single-digit months, days and times", () => {
  assert.equal(
    formatDateTime(new Date("2026-03-02T01:34:05.000Z")),
    "2026-03-02 07:04:05",
  );
});

test("returns null for missing or unparseable input", () => {
  assert.equal(formatDateTime(null), null);
  assert.equal(formatDateTime(""), null);
  assert.equal(formatDateTime("not a date"), null);
  assert.equal(formatDateTime(new Date("nonsense")), null);
});

test("defaults to now, so a history entry never carries a null date", () => {
  // Note this is why `undefined` is not in the null cases above: it triggers
  // the default parameter, which is what every createXHistoryEntry relies on.
  assert.match(formatDateTime(), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  assert.match(formatDateTime(undefined), /^\d{4}-\d{2}-\d{2}/);
});
