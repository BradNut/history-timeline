<script lang="ts">
	import type { PageData } from "./$types";
	import AnchorDateScrubber from "$lib/components/AnchorDateScrubber.svelte";
	import GranularitySelector from "$lib/components/GranularitySelector.svelte";
	import TopicFilter from "$lib/components/TopicFilter.svelte";
	import Timeline from "$lib/components/Timeline.svelte";
	import EventDetailModal from "$lib/components/EventDetailModal.svelte";
	import type { EventWithTopics } from "./+page.server";

	let { data }: { data: PageData } = $props();

	let selectedEvent = $state<EventWithTopics | null>(null);
</script>

<svelte:head>
	<title>History Timeline</title>
</svelte:head>

<div class="min-h-screen bg-[#0a0a0a] text-white">
	<header
		class="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur sticky top-0 z-10"
	>
		<div
			class="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-4 justify-between"
		>
			<h1 class="text-xl font-bold tracking-tight">History Timeline</h1>
			<div class="flex flex-col sm:flex-row items-center gap-4">
				<AnchorDateScrubber
					anchorDate={data.anchorDate}
					granularity={data.granularity}
				/>
				<GranularitySelector granularity={data.granularity} />
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-4 py-8">
		{#if data.topics.length > 0}
			<div class="mb-8">
				<TopicFilter topics={data.topics} activeSlug={data.topicSlug} />
			</div>
		{/if}

		<Timeline events={data.events} onselect={(e) => (selectedEvent = e)} />
	</main>

	{#if selectedEvent}
		<EventDetailModal
			event={selectedEvent}
			onclose={() => (selectedEvent = null)}
		/>
	{/if}
</div>
