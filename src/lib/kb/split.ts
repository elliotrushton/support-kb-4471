// What #4471 actually holds. causes.ts sorts reports by tenant and channel; it files a report about a
// date that moved by one day under its tenant's cause, because a tenant has only one. The desk reads
// those reports (desk-notes.json, oneDayMove) and they describe a different bug: the day shifts, the
// month does not. Here they are their own problem.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'day-shift';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'day-shift'];

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem | 'unplaced' {
  if (oneDayMove.includes(r.id)) return 'day-shift';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: string[];
  channels: Record<Report['channel'], number>;
  firstSeen: string;
  lastSeen: string;
};

// One row per problem, over the unique reports merged into `ticket`.
export function splitTicket(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { merged: Report[]; groups: ProblemGroup[] } {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const by = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const rank: ProblemGroup['problem'][] = [...PROBLEMS, 'unplaced'];
  const groups = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce((n, r) => ({ ...n, [r.channel]: n[r.channel] + 1 }), { app: 0, email: 0, form: 0 }),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => rank.indexOf(a.problem) - rank.indexOf(b.problem));
  return { merged, groups };
}
