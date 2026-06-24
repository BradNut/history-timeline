<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { House, TriangleAlert } from "@lucide/svelte";

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? "Something went wrong");

	const title = $derived.by(() => {
		if (status === 404) return "Page not found";
		if (status >= 500) return "Server error";
		if (status >= 400) return "Something went wrong";
		return "Error";
	});

	const description = $derived.by(() => {
		if (status === 404)
			return "The page you're looking for doesn't exist or may have been moved.";
		if (status >= 500)
			return "We hit an unexpected problem on our end. Please try again in a moment.";
		return message;
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
				class="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5"
			>
				<TriangleAlert size={28} class="text-white/70" />
			</div>
		</div>

		<div class="space-y-2">
			<p class="text-6xl font-bold tracking-tight tabular-nums">{status}</p>
			<h1 class="text-xl font-semibold">{title}</h1>
			<p class="text-white/50">{description}</p>
		</div>

		<div class="flex items-center justify-center gap-3">
			<Button href="/" class="cursor-pointer">
				<House size={16} />
				Back to timeline
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
