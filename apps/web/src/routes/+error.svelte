<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Hourglass, House } from "@lucide/svelte";

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? "Something went wrong");

	const title = $derived.by(() => {
		if (status === 404) return "Lost to history";
		if (status >= 500) return "A glitch in the timeline";
		if (status >= 400) return "This request got lost in time";
		return "Something came undone";
	});

	const description = $derived.by(() => {
		if (status === 404)
			return "We dug through the archives, but this moment never made it into the record.";
		if (status >= 500)
			return "History hiccuped on our end — our archivists are already rewinding the tape.";
		return message;
	});

	const quip = $derived.by(() => {
		if (status === 404) return "Some pages, like empires, simply fade away.";
		if (status >= 500)
			return "Those who forget to catch their errors are doomed to repeat them.";
		return "Every timeline has a few missing pages.";
	});

	const showDetail = $derived(
		status >= 500 && !!message && message !== description,
	);
</script>

<svelte:head>
	<title>{status} — History Timeline</title>
</svelte:head>

<div
	class="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4"
>
	<div class="max-w-md w-full text-center space-y-6">
		<div class="flex justify-center">
			<div
				class="flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10"
			>
				<Hourglass
					size={28}
					class="text-amber-400 animate-spin [animation-duration:6s]"
				/>
			</div>
		</div>

		<div class="space-y-2">
			<p class="text-7xl font-bold tracking-tight tabular-nums">{status}</p>
			<h1 class="text-xl font-semibold">{title}</h1>
			<p class="text-white/50">{description}</p>
		</div>

		<p class="text-sm italic text-white/30">&ldquo;{quip}&rdquo;</p>

		<div class="flex items-center justify-center gap-3">
			<Button href="/" class="cursor-pointer">
				<House size={16} />
				Back to the timeline
			</Button>
		</div>

		{#if showDetail}
			<p
				class="text-xs text-white/30 font-mono break-words border-t border-white/10 pt-4"
			>
				{message}
			</p>
		{/if}
	</div>
</div>
