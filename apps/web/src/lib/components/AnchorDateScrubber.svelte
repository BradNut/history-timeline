<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	type Granularity = 'today' | 'week' | 'month';

	let { anchorDate, granularity }: { anchorDate: string; granularity: Granularity } = $props();

	function formatLabel(dateStr: string, g: Granularity): string {
		const d = new Date(dateStr + 'T12:00:00');
		const fmt = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' });

		if (g === 'today') return fmt.format(d);

		if (g === 'week') {
			const start = new Date(d);
			start.setDate(start.getDate() - 3);
			const end = new Date(d);
			end.setDate(end.getDate() + 3);
			const m = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(start);
			return `Week of ${m} ${start.getDate()}–${end.getDate()}`;
		}

		return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);
	}

	function shift(direction: -1 | 1) {
		const d = new Date(anchorDate + 'T12:00:00');
		const delta = direction * (granularity === 'today' ? 1 : granularity === 'week' ? 7 : 30);
		d.setDate(d.getDate() + delta);
		const params = new URLSearchParams(page.url.searchParams);
		params.set('date', d.toISOString().split('T')[0]);
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}
</script>

<div class="flex items-center gap-3">
	<button
		class="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/50 transition-colors"
		onclick={() => shift(-1)}
		aria-label="Previous"
	>
		‹
	</button>
	<span class="text-white font-semibold text-lg min-w-48 text-center">
		{formatLabel(anchorDate, granularity)}
	</span>
	<button
		class="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/50 transition-colors"
		onclick={() => shift(1)}
		aria-label="Next"
	>
		›
	</button>
</div>
