import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

// JWT_EXPIRY has to be set before the module graph loads: credentials.js reads
// process.env once, at import, and cookie-option.js derives the TTL from it at
// import too. node --test gives each test file its own process, so this does
// not leak into the other suites.
process.env.JWT_EXPIRY = "1h";

const { TOKEN_TTL_SECONDS, COOKIE_OPTIONS, parseDurationToMs } =
  await import("../src/constant/cookie-option.js");

const ONE_HOUR_SECONDS = 60 * 60;

test("a token signed with JWT_EXPIRY=1h expires after one hour", () => {
  const token = jwt.sign({ id: "test" }, "test-secret", {
    expiresIn: TOKEN_TTL_SECONDS,
    algorithm: "HS256",
  });

  const { iat, exp } = jwt.verify(token, "test-secret");

  assert.equal(exp - iat, ONE_HOUR_SECONDS);
});

test("the cookie outlives the token by exactly nothing", () => {
  // The bug this guards: maxAge was pinned to 24h while the JWT followed
  // JWT_EXPIRY, so the browser kept sending a cookie the API had stopped
  // accepting — a session that looks alive and 401s on every call.
  assert.equal(COOKIE_OPTIONS.maxAge, ONE_HOUR_SECONDS * 1000);
});

test("parseDurationToMs reads each supported unit", () => {
  assert.equal(parseDurationToMs("500ms"), 500);
  assert.equal(parseDurationToMs("45s"), 45_000);
  assert.equal(parseDurationToMs("30m"), 1_800_000);
  assert.equal(parseDurationToMs("24h"), 86_400_000);
  assert.equal(parseDurationToMs("7d"), 604_800_000);
});

test("parseDurationToMs reads a bare number as seconds, not milliseconds", () => {
  // jsonwebtoken's own string form would make this 3.6 seconds.
  assert.equal(parseDurationToMs("3600"), 3_600_000);
});

test("parseDurationToMs rejects what it cannot read", () => {
  for (const value of [
    "",
    "24hh",
    "h24",
    "-1h",
    "0h",
    "1.5h",
    "abc",
    null,
    24,
  ]) {
    assert.equal(parseDurationToMs(value), null, `expected null for ${value}`);
  }
});
