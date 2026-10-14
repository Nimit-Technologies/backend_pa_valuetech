import test from "node:test";
import assert from "node:assert/strict";

import { CREDENTIALS } from "../src/constant/credentials.js";
import {
  caseSchema,
  similarCaseSchema,
} from "../src/features/case/case.schema.js";
import {
  DEFAULT_PAGE_SIZE,
  MAX_OFFSET,
  MAX_PAGE_SIZE,
  normalizePhone,
  resolvePageSize,
  shapeSimilarCase,
} from "../src/features/case/utils/case-similarity.js";

// These cover the parts of the similar-case search that are pure functions.
// The ranking itself lives in SQL — exact phone matches above address matches,
// descending similarity, the pg_trgm threshold and the GIN index — and is
// verified against a real database, not here. A green run of this file does not
// mean the search finds the right cases; it means the input handling and the
// response shape are right.

const ADDRESS = {
  lane: "Plot 14, Sector 65",
  landmark: "Near Metro Station 5",
  city: "Noida",
  district: "Gautam Buddha Nagar",
  state: "Uttar Pradesh",
  pin_code: "201305",
  country: "India",
};

const body = (overrides = {}) => ({
  customer_contact_number: "7536987402",
  address: { ...ADDRESS },
  ...overrides,
});

test("normalizePhone reduces every formatting of a number to the ten stored digits", () => {
  assert.equal(normalizePhone("7536987402"), "7536987402");
  assert.equal(normalizePhone("+91 75369-87402"), "7536987402");
  assert.equal(normalizePhone(" (753) 698 7402 "), "7536987402");
  assert.equal(normalizePhone("091-7536987402"), "7536987402");
  // Numeric input, which a JSON body can carry even though the schema asks for
  // a string.
  assert.equal(normalizePhone(7536987402), "7536987402");
});

test("normalizePhone rejects anything that cannot be ten digits", () => {
  assert.equal(normalizePhone("753698740"), null, "nine digits");
  assert.equal(normalizePhone("abcdefghij"), null, "no digits at all");
  assert.equal(normalizePhone(""), null);
  assert.equal(normalizePhone(null), null);
  assert.equal(normalizePhone(undefined), null);
  assert.equal(normalizePhone({}), null);
});

test("resolvePageSize falls back and clamps instead of trusting DATA_LIMIT", () => {
  const original = CREDENTIALS.DATA_LIMIT;

  try {
    CREDENTIALS.DATA_LIMIT = "25";
    assert.equal(resolvePageSize(), 25, "honours a sane configured value");

    CREDENTIALS.DATA_LIMIT = "80";
    assert.equal(resolvePageSize(), MAX_PAGE_SIZE, "clamps to the ceiling");

    CREDENTIALS.DATA_LIMIT = undefined;
    assert.equal(
      resolvePageSize(),
      DEFAULT_PAGE_SIZE,
      "an unset env must not become NaN",
    );

    CREDENTIALS.DATA_LIMIT = "not a number";
    assert.equal(resolvePageSize(), DEFAULT_PAGE_SIZE);

    CREDENTIALS.DATA_LIMIT = "0";
    assert.equal(resolvePageSize(), DEFAULT_PAGE_SIZE);

    CREDENTIALS.DATA_LIMIT = "-5";
    assert.equal(resolvePageSize(), DEFAULT_PAGE_SIZE);
  } finally {
    CREDENTIALS.DATA_LIMIT = original;
  }
});

test("the default page is ten cases", () => {
  assert.equal(DEFAULT_PAGE_SIZE, 10);
});

test("the similarity threshold is a usable pg_trgm cutoff", () => {
  const threshold = CREDENTIALS.ADDRESS_SIMILARITY_THRESHOLD;

  assert.equal(typeof threshold, "number");
  assert.ok(threshold > 0 && threshold <= 1, `got ${threshold}`);
});

test("similarCaseSchema normalizes the phone number and the address", () => {
  const parsed = similarCaseSchema.safeParse(
    body({ customer_contact_number: "+91 75369-87402" }),
  );

  assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
  assert.equal(parsed.data.customer_contact_number, "7536987402");
  assert.equal(parsed.data.address.city, "noida");
  assert.equal(parsed.data.address.state, "uttar pradesh");
  assert.equal(parsed.data.offset, 0, "offset defaults to the first page");
});

test("similarCaseSchema rejects a missing or unusable phone number", () => {
  assert.ok(
    !similarCaseSchema.safeParse(body({ customer_contact_number: undefined }))
      .success,
  );
  assert.ok(
    !similarCaseSchema.safeParse(body({ customer_contact_number: "" })).success,
  );
  assert.ok(
    !similarCaseSchema.safeParse(body({ customer_contact_number: "12345" }))
      .success,
  );
});

test("similarCaseSchema rejects an incomplete or malformed address", () => {
  const { city: _city, ...withoutCity } = ADDRESS;

  assert.ok(
    !similarCaseSchema.safeParse(body({ address: withoutCity })).success,
    "city is required",
  );
  assert.ok(
    !similarCaseSchema.safeParse(body({ address: undefined })).success,
    "the address itself is required",
  );
  assert.ok(
    !similarCaseSchema.safeParse(
      body({ address: { ...ADDRESS, pin_code: "2013" } }),
    ).success,
    "a PIN must be six digits",
  );
});

test("similarCaseSchema refuses a client-supplied limit", () => {
  const parsed = similarCaseSchema.safeParse(body({ limit: 20 }));

  assert.ok(!parsed.success, "page size comes from DATA_LIMIT, not the client");
  assert.match(parsed.error.issues[0].message, /limit/i);
});

test("similarCaseSchema validates the load-more offset", () => {
  assert.equal(
    similarCaseSchema.safeParse(body({ offset: 10 })).data.offset,
    10,
  );
  assert.equal(similarCaseSchema.safeParse(body({ offset: 0 })).data.offset, 0);

  assert.ok(!similarCaseSchema.safeParse(body({ offset: -1 })).success);
  assert.ok(!similarCaseSchema.safeParse(body({ offset: 1.5 })).success);
  assert.ok(!similarCaseSchema.safeParse(body({ offset: "10" })).success);
  assert.ok(
    !similarCaseSchema.safeParse(body({ offset: MAX_OFFSET + 1 })).success,
    "deep paging is bounded",
  );
});

test("similarCaseSchema accepts a case_id to exclude and rejects a malformed one", () => {
  const validCuid = "ckv1case00000000000000001";

  const parsed = similarCaseSchema.safeParse(body({ case_id: validCuid }));
  assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
  assert.equal(parsed.data.case_id, validCuid);

  assert.ok(!similarCaseSchema.safeParse(body({ case_id: "nope" })).success);
  assert.ok(!similarCaseSchema.safeParse(body({ case_id: 42 })).success);
});

test("shapeSimilarCase returns the case id and nothing beyond the contract", () => {
  const shaped = shapeSimilarCase({
    id: "ckv1case0000000000000001",
    file_number: "ABC/2026/104",
    business_type_name: "retail",
    business_type_id: "ckv1btyp0000000000000009",
    phone_match: true,
    address_similarity: 0.82,
    customer_name: "someone",
  });

  assert.deepEqual(shaped, {
    id: "ckv1case0000000000000001",
    file_number: "ABC/2026/104",
    business_type_name: "retail",
  });

  // The ranking inputs exist only to order the query; returning them would
  // widen the contract, and business_type_id in particular must never land on
  // the id field.
  assert.deepEqual(Object.keys(shaped), [
    "id",
    "file_number",
    "business_type_name",
  ]);
  assert.notEqual(shaped.id, "ckv1btyp0000000000000009");
});

test("shapeSimilarCase names the business type rather than identifying it", () => {
  const shaped = shapeSimilarCase({
    id: "ckv1case0000000000000002",
    file_number: "ABC/2026/105",
    business_type_name: "national",
  });

  assert.equal(shaped.business_type_name, "national");
});

// The create-case duplicate gate hinges entirely on this flag defaulting to
// false: if an omitted flag parsed as true, every create would skip the gate
// and the feature would be silently inert.
const createBody = (overrides = {}) => ({
  file_number: "GATE/2026/1",
  banker_name: "a banker",
  customer_name: "a customer",
  customer_contact_number: "7536987402",
  case_type: "valuation",
  business_type_id: "ckv1btyp00000000000000001",
  bank_id: "ckv1bank00000000000000001",
  address: { ...ADDRESS },
  ...overrides,
});

test("confirm_duplicate defaults to false, so an omitted flag still gates", () => {
  const parsed = caseSchema.safeParse(createBody());

  assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
  assert.equal(parsed.data.confirm_duplicate, false);
});

test("confirm_duplicate must be an actual boolean", () => {
  assert.equal(
    caseSchema.safeParse(createBody({ confirm_duplicate: true })).data
      .confirm_duplicate,
    true,
  );
  assert.equal(
    caseSchema.safeParse(createBody({ confirm_duplicate: false })).data
      .confirm_duplicate,
    false,
  );

  // A truthy string must not read as consent to create a duplicate.
  for (const value of ["yes", "true", 1, null]) {
    assert.ok(
      !caseSchema.safeParse(createBody({ confirm_duplicate: value })).success,
      `${JSON.stringify(value)} should be rejected`,
    );
  }
});
