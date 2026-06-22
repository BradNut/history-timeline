<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { EventWithTopics } from '../../routes/+page.server';

	type FullEvent = EventWithTopics & {
		related?: Array<{ id: number; title: string; year: number; sourceType: string | null }>;
	};

	let {
		event,
		onclose
	}: {
		event: EventWithTopics;
		onclose: () => void;
	} = $props();

	let fullEvent = $state<FullEvent | null>(null);
	let loading = $state(true);

	$effect(() => {
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

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	const displayed = $derived(fullEvent ?? event);
</script>

<div
	class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
	role="dialog"
	aria-modal="true"
	onclick={handleBackdropClick}
	onkeydown={handleKeydown}
	tabindex="-1"
>
	<div class="bg-[#111] border border-white/15 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
		<div class="flex justify-between items-start gap-3">
			<h2 class="text-white font-bold text-xl leading-snug">{displayed.title}</h2>
			<button
				class="text-white/40 hover:text-white text-2xl leading-none shrink-0"
				onclick={onclose}
				aria-label="Close"
			>×</button>
		</div>

		{#if loading}
			<div class="h-2 bg-white/10 rounded animate-pulse"></div>
		{/if}

		{#if displayed.imageUrl}
			<img src={displayed.imageUrl} alt={displayed.title} class="w-full rounded-lg object-cover max-h-48" />
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
			<p class="text-white/70 text-sm leading-relaxed">{displayed.description}</p>
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
				<h3 class="text-white/50 text-xs uppercase tracking-widest mb-3">Also on this date</h3>
				<ul class="space-y-2">
					{#each fullEvent.related as rel}
						<li class="text-white/60 text-sm">
							<span class="text-white/30 mr-2">{rel.year}</span>{rel.title}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
