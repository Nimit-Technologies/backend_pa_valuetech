-- Similar-case search: exact customer phone match plus fuzzy address match,
-- run before a new case is submitted so a property already on file surfaces
-- instead of being valued twice.
--
-- Nothing here is reachable from the Prisma query API: similarity() and the `%`
-- operator have no Prisma equivalent, so the search is a parameterized raw
-- query. What this migration provides is the normalized string it matches
-- against, the one definition of how that string is built, and the two indexes
-- that keep the search off a sequential scan.

-- similarity(), the `%` operator and the gin_trgm_ops opclass used below.
-- Requires a role with rights to create extensions; `migrate dev` replays this
-- on the shadow database too, so the same grant is needed there.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- The single definition of "normalized address". Both sides of the search call
-- it: the trigger below, to maintain addresses.search_text, and the search
-- query, applied to its own request parameters. One definition is the whole
-- point — a second implementation in JavaScript would drift from this one, and
-- a search that silently stops matching is hard to notice.
--
-- IMMUTABLE so an index or a generated expression may call it. Assembled with
-- `||` and coalesce rather than concat_ws, which is only STABLE and so cannot
-- be called from an IMMUTABLE function. Every run of non-alphanumeric
-- characters collapses to one space, which is what makes capitalization,
-- whitespace and punctuation differences wash out.
CREATE OR REPLACE FUNCTION case_address_search_text(
  lane     TEXT,
  landmark TEXT,
  city     TEXT,
  district TEXT,
  state    TEXT,
  pin_code TEXT,
  country  TEXT
) RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT btrim(
    regexp_replace(
      lower(
        coalesce(lane, '')     || ' ' ||
        coalesce(landmark, '') || ' ' ||
        coalesce(city, '')     || ' ' ||
        coalesce(district, '') || ' ' ||
        coalesce(state, '')    || ' ' ||
        coalesce(pin_code, '') || ' ' ||
        coalesce(country, '')
      ),
      '[^[:alnum:]]+', ' ', 'g'
    )
  );
$$;

-- AlterTable
ALTER TABLE "addresses" ADD COLUMN "search_text" TEXT;

-- Backfill existing rows before the GIN index is built: the index is then
-- populated in one pass rather than row by row, and no case is invisible to the
-- search merely because it predates this migration.
UPDATE "addresses"
SET "search_text" = case_address_search_text(
  "lane", "landmark", "city", "district", "state", "pin_code", "country"
);

-- Keeping search_text in sync is the database's job, not the application's.
-- Addresses are written from three unrelated places — the nested create in
-- service.create.case.js, the nested update in service.update.case.js, and
-- PUT /address/update/:id, which edits a row directly with the case services
-- bypassed entirely. Application-level computation would desync on that third
-- path.
--
-- The trigger fires on every INSERT and UPDATE rather than only on the seven
-- source columns, so the value is derived by construction: a write that tried
-- to set search_text itself is overwritten rather than trusted.
CREATE OR REPLACE FUNCTION addresses_set_search_text() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."search_text" := case_address_search_text(
    NEW."lane", NEW."landmark", NEW."city", NEW."district",
    NEW."state", NEW."pin_code", NEW."country"
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "addresses_search_text_sync" ON "addresses";
CREATE TRIGGER "addresses_search_text_sync"
BEFORE INSERT OR UPDATE ON "addresses"
FOR EACH ROW
EXECUTE FUNCTION addresses_set_search_text();

-- CreateIndex
-- Serves the `%` operator the search uses. A plain `similarity(a, b) >= threshold`
-- comparison would not touch this index and would degrade to a sequential scan
-- computing a similarity per row; the threshold therefore reaches the query via
-- set_limit() and the `%` operator, not via an explicit comparison.
--
-- Not CONCURRENTLY: Prisma runs a migration inside a transaction, where
-- CREATE INDEX CONCURRENTLY is not allowed. This takes a brief write lock on
-- addresses.
CREATE INDEX "addresses_search_text_idx" ON "addresses" USING GIN ("search_text" gin_trgm_ops);

-- CreateIndex
-- The exact half of the search. Values are already exactly 10 digits on every
-- write path (see the zod schema), so the column needs an index, not
-- normalizing.
CREATE INDEX "cases_customer_contact_number_idx" ON "cases"("customer_contact_number");
