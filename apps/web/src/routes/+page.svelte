<script lang="ts">
	import { tick } from "svelte";
	import AnchorDateScrubber from "$lib/components/AnchorDateScrubber.svelte";
	import EventDetailModal from "$lib/components/EventDetailModal.svelte";
	import GranularitySelector from "$lib/components/GranularitySelector.svelte";
	import LandingPage from "$lib/components/LandingPage.svelte";
	import SourceAttribution from "$lib/components/SourceAttribution.svelte";
	import Timeline from "$lib/components/Timeline.svelte";
	import TopicFilter from "$lib/components/TopicFilter.svelte";
	import type { EventWithTopics } from "./+page.server";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	let timelineData = $derived(data.view === "timeline" ? data : null);

	let selectedEvent = $state<EventWithTopics | null>(null);
	let modalOpen = $state(false);
	let highlightedEventId = $state<number | undefined>(undefined);

	$effect(() => {
		if (!modalOpen) selectedEvent = null;
	});

	async function handleRelatedSelect(rel: { id: number }) {
		modalOpen = false;
		highlightedEventId = rel.id;
		await tick();
		setTimeout(() => {
			document.getElementById(`event-${rel.id}`)?.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}, 150);
		setTimeout(() => {
			highlightedEventId = undefined;
		}, 5000);
	}
</script>

<svelte:head>
	<title>History Timeline</title>
</svelte:head>

{#if data.view === "landing"}
	<LandingPage />
{:else if timelineData}
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
						anchorDate={timelineData.anchorDate}
						granularity={timelineData.granularity}
					/>
					<GranularitySelector granularity={timelineData.granularity} />
				</div>
			</div>
		</header>

		<main class="max-w-4xl mx-auto px-4 py-8">
			{#if timelineData.topics.length > 0}
				<div class="mb-8">
					<TopicFilter
						topics={timelineData.topics}
						activeSlug={timelineData.topicSlug}
					/>
				</div>
			{/if}

			<Timeline
				events={timelineData.events}
				{highlightedEventId}
				onselect={(e) => {
					selectedEvent = e;
					modalOpen = true;
				}}
			/>
		</main>

		<SourceAttribution />

		{#if selectedEvent}
			<EventDetailModal
				event={selectedEvent}
				bind:open={modalOpen}
				onrelateselect={handleRelatedSelect}
			/>
		{/if}
	</div>
{/if}
