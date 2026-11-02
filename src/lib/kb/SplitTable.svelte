<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { splitTicket, type Problem } from '#lib/kb/split';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // tickets: where each problem is now filed, e.g. { parser: 'https://…/issues/1' }.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const filed = $derived(split.groups.reduce((n, g) => n + g.reports.length, 0));
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>app · email · form</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      {@const href = g.problem === 'unplaced' ? undefined : tickets[g.problem]}
      <tr class:open={!href}>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td>{g.tenants.length}</td>
        <td>{g.channels.app} · {g.channels.email} · {g.channels.form}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if href}<a {href}>{href.replace(/^https:\/\/github\.com\//, '')}</a>{:else}none yet{/if}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td>{filed}</td><td colspan="4">{filed === split.merged.length ? 'every report placed once' : `${split.merged.length - filed} not placed`}</td></tr>
  </tfoot>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .open td { background: var(--warn-bg); }
  .open td:last-child { color: var(--warn); font-weight: 600; }
  tfoot td { color: var(--muted); font-size: 0.85em; }
</style>
