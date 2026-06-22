<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageData, ActionData } from "./$types";

	let {
		data,
		form,
	}: {
		data: PageData;
		form:
			| (ActionData & {
					success?: boolean;
					eventsUpserted?: number;
					unmappedCount?: number;
					error?: string;
			  })
			| null;
	} = $props();

	let importingDaily = $state(false);
	let importingFull = $state(false);

	function formatDate(ts: string | null) {
		if (!ts) return "—";
		return new Date(ts).toLocaleString();
	}

	function durationMs(start: string, end: string | null) {
		if (!end) return "—";
		return `${Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000)}s`;
	}
</script>

<svelte:head><title>Admin — History Timeline</title></svelte:head>

<h1 class="text-2xl font-bold mb-8">Import Dashboard</h1>

<div class="flex gap-4 mb-6">
	<form
		method="POST"
		action="?/runDaily"
		use:enhance={() => {
			importingDaily = true;
			return async ({ update }) => {
				importingDaily = false;
				await update();
			};
		}}
	>
		<button
			type="submit"
			disabled={importingDaily || importingFull}
			class="px-4 py-2 bg-white text-black rounded font-medium hover:bg-white/90 disabled:opacity-50 transition-colors"
		>
			{importingDaily ? "Running…" : "Run Daily Import"}
		</button>
	</form>

	<form
		method="POST"
		action="?/runFull"
		use:enhance={() => {
			importingFull = true;
			return async ({ update }) => {
				importingFull = false;
				await update();
			};
		}}
	>
		<button
			type="submit"
			disabled={importingDaily || importingFull}
			class="px-4 py-2 border border-white/20 rounded font-medium hover:bg-white/10 disabled:opacity-50 transition-colors"
		>
			{importingFull ? "Running…" : "Run Full Import (366 days)"}
		</button>
	</form>
</div>

{#if form?.success}
	<div
		class="mb-6 p-3 rounded bg-green-900/20 border border-green-500/20 text-sm text-green-400"
	>
		Done: {form.eventsUpserted} events upserted, {form.unmappedCount} unmapped
	</div>
{:else if form?.error}
	<div
		class="mb-6 p-3 rounded bg-red-900/20 border border-red-500/20 text-sm text-red-400"
	>
		{form.error}
	</div>
{/if}

<h2 class="text-lg font-semibold mb-3 text-white/70">Recent Import Logs</h2>

{#if data.logs.length === 0}
	<p class="text-white/40 text-sm">No imports run yet.</p>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full text-sm text-left border-collapse">
			<thead>
				<tr
					class="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider"
				>
					<th class="py-2 pr-4">Type</th>
					<th class="py-2 pr-4">Status</th>
					<th class="py-2 pr-4">Events</th>
					<th class="py-2 pr-4">Unmapped</th>
					<th class="py-2 pr-4">Duration</th>
					<th class="py-2">Started</th>
				</tr>
			</thead>
			<tbody>
				{#each data.logs as log}
					<tr class="border-b border-white/5 hover:bg-white/5">
						<td class="py-2 pr-4 capitalize">{log.type}</td>
						<td class="py-2 pr-4">
							<span
								class="px-1.5 py-0.5 rounded text-xs
								{log.status === 'done'
									? 'bg-green-900/50 text-green-400'
									: log.status === 'error'
										? 'bg-red-900/50 text-red-400'
										: 'bg-yellow-900/50 text-yellow-400'}"
							>
								{log.status}
							</span>
						</td>
						<td class="py-2 pr-4">{log.eventsUpserted}</td>
						<td class="py-2 pr-4">{log.unmappedCount}</td>
						<td class="py-2 pr-4"
							>{durationMs(
								String(log.startedAt),
								log.finishedAt ? String(log.finishedAt) : null,
							)}</td
						>
						<td class="py-2 text-white/50"
							>{formatDate(String(log.startedAt))}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
