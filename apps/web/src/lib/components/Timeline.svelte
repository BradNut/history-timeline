<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { EventWithTopics } from '../../routes/+page.server';

	let {
		events,
		onselect
	}: {
		events: EventWithTopics[];
		onselect: (event: EventWithTopics) => void;
	} = $props();

	type YearGroup = { year: number; events: EventWithTopics[] };

	const grouped = $derived.by(() => {
		const map = new Map<number, EventWithTopics[]>();
		for (const evt of events) {
			if (!map.has(evt.year)) map.set(evt.year, []);
			map.get(evt.year)!.push(evt);
		}
		return [...map.entries()]
			.sort(([a], [b]) => b - a)
			.map(([year, evts]) => ({ year, events: evts }) satisfies YearGroup);
	});

	function formatDate(evt: EventWithTopics): string {
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return `${months[evt.month - 1]} ${evt.day}`;
	}
</script>

{#if grouped.length === 0}
	<div class="text-white/40 text-center py-24 text-lg">
		No events found for this date range. Try running an import from the admin area.
	</div>
{:else}
	<div class="relative">
		<div class="absolute left-24 top-0 bottom-0 w-px bg-white/10"></div>

		{#each grouped as group}
			<div class="mb-12">
				<div class="flex items-start gap-0">
					<div class="w-24 pr-4 pt-1 text-right">
						<span class="text-2xl font-bold text-white/30 leading-none">{group.year}</span>
					</div>

					<div class="flex-1 pl-8 space-y-4">
						{#each group.events as evt}
							<button
								class="w-full text-left group cursor-pointer"
								onclick={() => onselect(evt)}
							>
								<div
									class="relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-lg p-4 transition-all"
								>
									<div class="absolute -left-[2.15rem] top-5 w-2 h-2 rounded-full bg-white/30 group-hover:bg-white/70 transition-colors"></div>

									<div class="flex items-start justify-between gap-3 mb-1">
										<h3 class="text-white font-semibold leading-snug">{evt.title}</h3>
										<span class="text-white/40 text-xs shrink-0 pt-0.5">{formatDate(evt)}</span>
									</div>

									{#if evt.description}
										<p class="text-white/60 text-sm line-clamp-2 mb-2">{evt.description}</p>
									{/if}

									{#if evt.topics.length > 0}
										<div class="flex flex-wrap gap-1.5">
											{#each evt.topics.slice(0, 3) as t}
												<Badge variant="outline" class="text-xs border-white/20 text-white/50">
													{t.subtopicName ?? t.topicName}
												</Badge>
											{/each}
										</div>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
