<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	type Granularity = 'today' | 'week' | 'month';

	const options: Array<{ value: Granularity; label: string }> = [
		{ value: 'today', label: 'Today' },
		{ value: 'week', label: 'This Week' },
		{ value: 'month', label: 'This Month' }
	];

	let { granularity }: { granularity: Granularity } = $props();

	function select(value: Granularity) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('granularity', value);
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}
</script>

<div class="flex rounded-md border border-white/10 overflow-hidden">
	{#each options as opt}
		<button
			class="px-4 py-1.5 text-sm font-medium transition-colors
				{granularity === opt.value
				? 'bg-white text-black'
				: 'text-white/70 hover:text-white hover:bg-white/10'}"
			onclick={() => select(opt.value)}
		>
			{opt.label}
		</button>
	{/each}
</div>
