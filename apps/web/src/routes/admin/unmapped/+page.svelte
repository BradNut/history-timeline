<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedTopicId = $state<Record<number, number>>({});
</script>

<svelte:head><title>Unmapped Categories — Admin</title></svelte:head>

<h1 class="text-2xl font-bold mb-2">Unmapped Categories</h1>
<p class="text-white/50 text-sm mb-8">Assign a Topic + Subtopic to each unrecognised Wikipedia category.</p>

{#if data.unresolved.length === 0}
	<p class="text-white/40">All categories are resolved.</p>
{:else}
	<div class="space-y-4">
		{#each data.unresolved as item}
			<form method="POST" action="?/resolve" class="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-wrap gap-3 items-end">
				<input type="hidden" name="unmappedId" value={item.id} />
				<input type="hidden" name="rawCategory" value={item.rawCategory} />

				<div class="flex-1 min-w-48">
					<p class="text-white font-medium text-sm">{item.rawCategory}</p>
					{#if item.exampleTitle}
						<p class="text-white/40 text-xs mt-0.5">e.g. {item.exampleTitle}</p>
					{/if}
				</div>

				<select
					name="topicId"
					class="bg-[#1a1a1a] border border-white/20 rounded px-3 py-1.5 text-sm text-white"
					onchange={(e) => { selectedTopicId[item.id] = Number((e.target as HTMLSelectElement).value); }}
				>
					<option value="">— Topic —</option>
					{#each data.topics as t}
						<option value={t.id}>{t.name}</option>
					{/each}
				</select>

				<select
					name="subtopicId"
					class="bg-[#1a1a1a] border border-white/20 rounded px-3 py-1.5 text-sm text-white"
				>
					<option value="">— Subtopic (optional) —</option>
					{#each data.subtopics.filter(s => s.topicId === selectedTopicId[item.id]) as s}
						<option value={s.id}>{s.name}</option>
					{/each}
				</select>

				<button
					type="submit"
					class="px-3 py-1.5 bg-white text-black text-sm rounded font-medium hover:bg-white/90"
				>
					Resolve
				</button>
			</form>
		{/each}
	</div>
{/if}
