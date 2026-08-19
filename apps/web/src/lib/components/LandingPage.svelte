<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import Timeline from "./Timeline.svelte";

	type LandingData = {
		redirectTo: string;
		date: string | null;
		granularity: "today" | "week" | "month";
		topicSlug: string | null;
	};

	let { data }: { data: LandingData } = $props();

	const signInHref = $derived(
		`/auth/sign-in?redirectTo=${encodeURIComponent(data.redirectTo)}`,
	);
	const signUpHref = $derived(
		`/auth/sign-up?redirectTo=${encodeURIComponent(data.redirectTo)}`,
	);

	const hasIntent = $derived(
		Boolean(data.date || data.topicSlug || data.granularity !== "today"),
	);

	const GRANULARITY_LABELS = {
		today: "Today",
		week: "This Week",
		month: "This Month",
	} as const;

	const granularityLabel = $derived(
		GRANULARITY_LABELS[data.granularity] ?? data.granularity,
	);

	const previewEvents = [
		{
			id: 1,
			title: "Apollo 11 Moon Landing",
			description:
				"Neil Armstrong and Buzz Aldrin become the first humans to set foot on the lunar surface.",
			eventDate: "1969-07-20",
			year: 1969,
			month: 7,
			day: 20,
			imageUrl: null,
			sourceUrl: null,
			sourceType: "event",
			topics: [
				{
					topicId: 1,
					topicName: "Scientific",
					topicSlug: "scientific",
					subtopicName: null,
				},
			],
		},
		{
			id: 2,
			title: "Declaration of Independence adopted",
			description:
				"The Second Continental Congress declares the Thirteen Colonies independent from Great Britain.",
			eventDate: "1776-07-04",
			year: 1776,
			month: 7,
			day: 4,
			imageUrl: null,
			sourceUrl: null,
			sourceType: "event",
			topics: [
				{
					topicId: 2,
					topicName: "Historical",
					topicSlug: "historical",
					subtopicName: "Wars",
				},
			],
		},
		{
			id: 3,
			title: "Chuck Yeager breaks the sound barrier",
			description:
				"Yeager becomes the first person to fly faster than the speed of sound in level flight.",
			eventDate: "1947-10-14",
			year: 1947,
			month: 10,
			day: 14,
			imageUrl: null,
			sourceUrl: null,
			sourceType: "event",
			topics: [
				{
					topicId: 1,
					topicName: "Scientific",
					topicSlug: "scientific",
					subtopicName: null,
				},
			],
		},
		{
			id: 4,
			title: "Einstein publishes general relativity",
			description:
				"Albert Einstein presents the field equations that form the geometric theory of gravitation.",
			eventDate: "1915-11-25",
			year: 1915,
			month: 11,
			day: 25,
			imageUrl: null,
			sourceUrl: null,
			sourceType: "event",
			topics: [
				{
					topicId: 1,
					topicName: "Scientific",
					topicSlug: "scientific",
					subtopicName: null,
				},
			],
		},
	];
</script>

<div class="min-h-screen bg-[#0a0a0a] text-white">
	<div class="max-w-4xl mx-auto px-4 py-16">
		<div class="text-center mb-12">
			<h1 class="text-4xl font-bold tracking-tight mb-4">History Timeline</h1>
			<p class="text-white/70 max-w-xl mx-auto mb-8">
				Explore historical events that happened on this day across the centuries
				— from scientific breakthroughs to political turning points.
			</p>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
				<Button href={signInHref} size="lg">Sign In</Button>
				<Button href={signUpHref} variant="outline" size="lg">Sign Up</Button>
			</div>
		</div>

		{#if hasIntent}
			<div
				class="mb-12 rounded-lg border border-white/10 bg-white/5 p-4 text-center"
			>
				<p class="text-white/80">
					You're trying to view the <strong>{granularityLabel}</strong>
					timeline
					{#if data.date}
						for <strong>{data.date}</strong>{/if}
					{#if data.topicSlug}
						in <strong>{data.topicSlug}</strong>{/if}. Sign in to see this view.
				</p>
				<Button href={signInHref} variant="secondary" class="mt-4">
					Sign In to Continue
				</Button>
			</div>
		{/if}

		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-xl font-semibold tracking-tight">Preview the Timeline</h2>
			<span class="text-white/40 text-sm">Sample events</span>
		</div>

		<div class="relative">
			<div class="max-h-[28rem] overflow-hidden">
				<Timeline events={previewEvents} onselect={(_event) => {}} />
			</div>
			<div
				class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent"
			></div>
		</div>
	</div>
</div>
