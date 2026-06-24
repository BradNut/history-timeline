<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import * as Dialog from "$lib/components/ui/dialog";
	import type { EventWithTopics } from "../../routes/+page.server";

	type FullEvent = EventWithTopics & {
		related?: Array<{
			id: number;
			title: string;
			year: number;
			sourceType: string | null;
		}>;
	};

	let {
		event,
		open = $bindable(false),
	}: {
		event: EventWithTopics;
		open: boolean;
	} = $props();

	let fullEvent = $state<FullEvent | null>(null);
	let loading = $state(true);

	$effect(() => {
		if (!open) return;
		loading = true;
		fullEvent = null;
		fetch(`/api/events/${event.id}`)
			.then((r) => r.json())
			.then((data) => {
				fullEvent = data;
				loading = false;
			})
			.catch(() => {
				fullEvent = { ...event, related: [] };
				loading = false;
			});
	});

	const displayed = $derived(fullEvent ?? event);
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="max-w-lg max-h-[85vh] overflow-y-auto bg-[#111] border-white/15"
	>
		<Dialog.Header>
			<Dialog.Title class="text-white font-bold text-xl leading-snug"
				>{displayed.title}</Dialog.Title
			>
		</Dialog.Header>

		{#if loading}
			<div class="h-2 bg-white/10 rounded animate-pulse"></div>
		{/if}

		{#if displayed.imageUrl}
			<img
				src={displayed.imageUrl}
				alt={displayed.title}
				class="w-full rounded-lg object-contain max-h-64 bg-white/5"
			/>
		{/if}

		{#if displayed.topics.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each displayed.topics as t}
					<Badge variant="outline" class="border-white/20 text-white/60">
						{t.subtopicName ?? t.topicName}
					</Badge>
				{/each}
			</div>
		{/if}

		{#if displayed.description}
			<p class="text-white/70 text-sm leading-relaxed">
				{displayed.description}
			</p>
		{/if}

		{#if displayed.sourceUrl}
			<a
				href={displayed.sourceUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
			>
				View on Wikipedia →
			</a>
		{/if}

		{#if fullEvent?.related && fullEvent.related.length > 0}
			<div class="border-t border-white/10 pt-4">
				<h3 class="text-white/50 text-xs uppercase tracking-widest mb-3">
					Also on this date
				</h3>
				<ul class="space-y-2">
					{#each fullEvent.related as rel}
						<li class="text-white/60 text-sm">
							<span class="text-white/30 mr-2">{rel.year}</span>{rel.title}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
