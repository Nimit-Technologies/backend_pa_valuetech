import prisma from "../../../prisma/client.js";

const RECONCILE_MS = 5 * 60 * 1000;

const MAX_RELOAD_ATTEMPTS = 3;

const NONE = Object.freeze({ total: 0, active: 0 });
const UNKNOWN = Object.freeze({ total: null, active: null });

const state = {
  counts: null,
  loadedAt: 0,
  writeVersion: 0,
  inflight: null,
};

const readCountsFromDb = async () => {
  const groups = await prisma.case.groupBy({
    by: ["is_active"],
    where: { deleted_at: null },
    _count: { _all: true },
  });

  let total = 0;
  let active = 0;
  for (const { is_active, _count } of groups) {
    total += _count._all;
    if (is_active) active += _count._all;
  }
  return Object.freeze({ total, active });
};

const reload = () => {
  if (state.inflight) return state.inflight;

  state.inflight = (async () => {
    try {
      let counts;
      for (let attempt = 1; ; attempt++) {
        const versionAtStart = state.writeVersion;
        counts = await readCountsFromDb();
        const stable = state.writeVersion === versionAtStart;
        if (stable || attempt >= MAX_RELOAD_ATTEMPTS) break;
      }

      const previous = state.counts;
      if (
        previous &&
        (previous.total !== counts.total || previous.active !== counts.active)
      ) {
        console.warn("case counts drifted; reconciled from database", {
          memory: previous,
          database: counts,
        });
      }

      state.counts = counts;
      state.loadedAt = Date.now();
      return counts;
    } finally {
      state.inflight = null;
    }
  })();

  return state.inflight;
};

export const getCaseCounts = async () => {
  if (state.counts) {
    if (Date.now() - state.loadedAt >= RECONCILE_MS) {
      reload().catch((error) =>
        console.error("case count reconcile failed:", error),
      );
    }
    return state.counts;
  }

  try {
    return await reload();
  } catch (error) {
    console.error("case count load failed:", error);
    return UNKNOWN;
  }
};

const applyDelta = (total, active) => {
  if (total === 0 && active === 0) return;
  state.writeVersion += 1;
  if (!state.counts) return;
  state.counts = Object.freeze({
    total: Math.max(0, state.counts.total + total),
    active: Math.max(0, state.counts.active + active),
  });
};

const contribution = (caseRecord) =>
  !caseRecord || caseRecord.deleted_at
    ? NONE
    : { total: 1, active: caseRecord.is_active ? 1 : 0 };

export const recordCaseTransition = (before, after) => {
  if (before === undefined || after === undefined) {
    invalidateCaseCounts();
    return;
  }
  const from = contribution(before);
  const to = contribution(after);
  applyDelta(to.total - from.total, to.active - from.active);
};

export const invalidateCaseCounts = () => {
  state.writeVersion += 1;
  state.counts = null;
  state.loadedAt = 0;
};
