// Scoring formula of the Home Assistant check-up (https://domotikpro.it/check-up).
// The server of the leaderboard recomputes the score with exactly this function from the counts it receives.

export type Counts = {
  entities: number;
  /** "Furnishable" entities (lights, switches, sensors, ...) and how many of them have no area. */
  watched: number;
  watchedNoArea: number;
  automations: number;
  /** Unavailable (including broken automations), ghosts, low batteries, pending updates. */
  nd: number;
  gh: number;
  bt: number;
  up: number;
  /** Automations never triggered, idle for months, turned off. */
  an: number;
  aw: number;
  ao: number;
};

export const WEIGHTS = { conn: 30, bat: 15, gho: 10, ord: 15, aut: 15, upd: 15 } as const;

export type VitalKey = keyof typeof WEIGHTS;

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function scoreFromCounts(c: Counts) {
  const auto = c.an + c.aw * 0.7 + c.ao * 0.5;
  const vitals: Record<VitalKey, number> = {
    conn: clamp(100 - (c.nd / c.entities) * 1000),
    bat: clamp(100 - c.bt * 12),
    gho: clamp(100 - c.gh * 5),
    ord: c.watched ? clamp(100 - (c.watchedNoArea / c.watched) * 110) : 100,
    aut: c.automations ? clamp(100 - (auto / c.automations) * 160) : 100,
    upd: clamp(100 - c.up * 10),
  };
  let weighted = 0;
  let total = 0;
  for (const key of Object.keys(WEIGHTS) as VitalKey[]) {
    weighted += vitals[key] * WEIGHTS[key];
    total += WEIGHTS[key];
  }
  return { score: Math.round(weighted / total), vitals, auto };
}

export function gradeKey(score: number): "zen" | "good" | "soso" | "bad" | "critical" {
  if (score >= 90) return "zen";
  if (score >= 75) return "good";
  if (score >= 55) return "soso";
  if (score >= 35) return "bad";
  return "critical";
}
