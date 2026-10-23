import test from "node:test";
import assert from "node:assert/strict";
import { mySubmittedReportsQuerySchema } from "./engineer.schema.js";

test("mySubmittedReportsQuerySchema defaults to the first page", () => {
  assert.deepEqual(mySubmittedReportsQuerySchema.parse({}), { page: 1 });
});

test("mySubmittedReportsQuerySchema accepts positive integer page strings", () => {
  assert.deepEqual(mySubmittedReportsQuerySchema.parse({ page: "3" }), {
    page: 3,
  });
});

test("mySubmittedReportsQuerySchema rejects invalid pages", () => {
  assert.equal(
    mySubmittedReportsQuerySchema.safeParse({ page: "0" }).success,
    false,
  );
  assert.equal(
    mySubmittedReportsQuerySchema.safeParse({ page: "1.5" }).success,
    false,
  );
});
