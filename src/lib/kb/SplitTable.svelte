<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, readAs, uniqueById, type Cause, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // The desk's own count (CauseTable's view), with each problem's new ticket next to it.
  // Reports the desk read as a one-day move stay counted under their cause and get a row of their own below it.
  type Problem = Cause | 'day-shift';
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByCause(merged, tenantOf));
  const shifted = $derived(merged.filter((r) => notes.oneDayMove.includes(r.id)));
  const seen = (rs: Report[]) => {
    const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
    return `${days[0]} → ${days[days.length - 1]}`;
  };
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.length + (shifted.length ? 1 : 0)}</strong> problems
</p>

{#snippet link(problem: Problem)}
  {@const href = tickets[problem]}
  {#if href}<a {href}>#{href.split('/').pop()}</a>{:else}none yet{/if}
{/snippet}

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.cause)}
      <tr>
        <td><code>{g.cause}</code></td>
        <td>{g.reports.length}</td>
        <td>{g.tenants}</td>
        <td>{seen(g.reports)}</td>
        <td>{#if g.cause !== 'unplaced'}{@render link(g.cause)}{:else}none yet{/if}</td>
      </tr>
      {@const moved = readAs(g, notes.oneDayMove)}
      {#if moved}
        <tr class="sub">
          <td><code>day-shift</code></td>
          <td>{moved}</td>
          <td>{new Set(shifted.map((r) => r.tenant)).size}</td>
          <td>{seen(shifted)}</td>
          <td>{@render link('day-shift')}</td>
        </tr>
        <tr class="note"><td colspan="5">{moved} of the <code>{g.cause}</code> reports read as a one-day move: counted under <code>{g.cause}</code> by tenant, filed as their own problem.</td></tr>
      {/if}
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .sub td:first-child { padding-left: 1.5rem; }
  .note td { color: var(--muted); font-size: 0.85em; border-bottom: none; }
</style>
