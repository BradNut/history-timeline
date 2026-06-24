<script lang="ts">
	import { goto } from "$app/navigation";
	import { navigating, page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { ChevronLeft, ChevronRight, LoaderCircle } from "@lucide/svelte";

	type Granularity = "today" | "week" | "month";

	let {
		anchorDate,
		granularity,
	}: { anchorDate: string; granularity: Granularity } = $props();

	const isNavigating = $derived(navigating.to !== null);
	const pendingDirection = $derived.by<-1 | 1 | null>(() => {
		const target = navigating.to?.url.searchParams.get("date");
		if (!target) return null;
		if (target > anchorDate) return 1;
		if (target < anchorDate) return -1;
		return null;
	});

	function formatLabel(dateStr: string, g: Granularity): string {
		const d = new Date(dateStr + "T12:00:00");
		const fmt = new Intl.DateTimeFormat("en-US", {
			month: "long",
			day: "numeric",
		});

		if (g === "today") return fmt.format(d);

		if (g === "week") {
			const start = new Date(d);
			start.setDate(start.getDate() - 3);
			const end = new Date(d);
			end.setDate(end.getDate() + 3);
			const m = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
				start,
			);
			return `Week of ${m} ${start.getDate()}–${end.getDate()}`;
		}

		return new Intl.DateTimeFormat("en-US", {
			month: "long",
			year: "numeric",
		}).format(d);
	}

	function shift(direction: -1 | 1) {
		if (isNavigating) return;
		const d = new Date(anchorDate + "T12:00:00");
		const delta =
			direction *
			(granularity === "today" ? 1 : granularity === "week" ? 7 : 30);
		d.setDate(d.getDate() + delta);
		const params = new URLSearchParams(page.url.searchParams);
		params.set("date", d.toISOString().split("T")[0]);
		goto(`?${params.toString()}`, { keepFocus: true });
	}
</script>

<div class="flex items-center gap-3">
	<Button
		variant="outline"
		size="icon"
		class="cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
		onclick={() => shift(-1)}
		disabled={isNavigating}
		aria-label="Previous"
	>
		{#if pendingDirection === -1}
			<LoaderCircle size={16} class="animate-spin" />
		{:else}
			<ChevronLeft size={16} />
		{/if}
	</Button>
	<span class="text-white font-semibold text-lg min-w-48 text-center">
		{formatLabel(anchorDate, granularity)}
	</span>
	<Button
		variant="outline"
		size="icon"
		class="cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
		onclick={() => shift(1)}
		disabled={isNavigating}
		aria-label="Next"
	>
		{#if pendingDirection === 1}
			<LoaderCircle size={16} class="animate-spin" />
		{:else}
			<ChevronRight size={16} />
		{/if}
	</Button>
</div>
