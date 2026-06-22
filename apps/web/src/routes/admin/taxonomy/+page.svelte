<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Taxonomy — Admin</title></svelte:head>

<h1 class="text-2xl font-bold mb-8">Taxonomy Management</h1>

<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
	<div class="bg-white/5 border border-white/10 rounded-lg p-5">
		<h2 class="font-semibold mb-4">Add Topic</h2>
		<form method="POST" action="?/addTopic" class="flex gap-2">
			<input
				name="name"
				placeholder="Topic name"
				class="flex-1 bg-[#1a1a1a] border border-white/20 rounded px-3 py-1.5 text-sm text-white"
				required
			/>
			<button type="submit" class="px-3 py-1.5 bg-white text-black text-sm rounded font-medium">Add</button>
		</form>
		<ul class="mt-4 space-y-1">
			{#each data.topics as t}
				<li class="text-white/70 text-sm">{t.name} <span class="text-white/30">/{t.slug}</span></li>
			{/each}
		</ul>
	</div>

	<div class="bg-white/5 border border-white/10 rounded-lg p-5">
		<h2 class="font-semibold mb-4">Add Subtopic</h2>
		<form method="POST" action="?/addSubtopic" class="flex gap-2 flex-wrap">
			<select name="topicId" class="bg-[#1a1a1a] border border-white/20 rounded px-3 py-1.5 text-sm text-white" required>
				<option value="">— Topic —</option>
				{#each data.topics as t}
					<option value={t.id}>{t.name}</option>
				{/each}
			</select>
			<input
				name="name"
				placeholder="Subtopic name"
				class="flex-1 bg-[#1a1a1a] border border-white/20 rounded px-3 py-1.5 text-sm text-white"
				required
			/>
			<button type="submit" class="px-3 py-1.5 bg-white text-black text-sm rounded font-medium">Add</button>
		</form>
		<ul class="mt-4 space-y-1">
			{#each data.subtopics as s}
				<li class="text-white/70 text-sm">{s.name} <span class="text-white/30">({data.topics.find(t => t.id === s.topicId)?.name})</span></li>
			{/each}
		</ul>
	</div>
</div>

<h2 class="text-lg font-semibold mb-3 text-white/70">Taxonomy Mappings ({data.mappings.length})</h2>

{#if data.mappings.length === 0}
	<p class="text-white/40 text-sm">No mappings yet. Resolve unmapped categories to create them.</p>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full text-sm text-left border-collapse">
			<thead>
				<tr class="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
					<th class="py-2 pr-4">Raw Category</th>
					<th class="py-2 pr-4">Topic</th>
					<th class="py-2 pr-4">Subtopic</th>
					<th class="py-2"></th>
				</tr>
			</thead>
			<tbody>
				{#each data.mappings as m}
					<tr class="border-b border-white/5 hover:bg-white/5">
						<td class="py-2 pr-4 font-mono text-xs text-white/80">{m.rawCategory}</td>
						<td class="py-2 pr-4 text-white/70">{m.topicName ?? '—'}</td>
						<td class="py-2 pr-4 text-white/50">{m.subtopicName ?? '—'}</td>
						<td class="py-2">
							<form method="POST" action="?/deleteMapping">
								<input type="hidden" name="id" value={m.id} />
								<button type="submit" class="text-red-400 hover:text-red-300 text-xs">Delete</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
