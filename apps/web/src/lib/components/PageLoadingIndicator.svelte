<script lang="ts">
	import { onNavigate } from "$app/navigation";

	let visible = $state(false);
	let progress = $state(0);
	let load_durations = $state<number[]>([]);
	let average_load = $derived(
		load_durations.reduce((a, b) => a + b, 0) / load_durations.length,
	);

	const increment = 1;

	onNavigate((navigation) => {
		const typical_load_time = average_load || 200;
		const frequency = typical_load_time / 100;
		let start = performance.now();
		visible = true;
		progress = 0;
		const interval = setInterval(() => {
			if (progress < 90) progress += increment;
		}, frequency);
		navigation?.complete.then(() => {
			progress = 100;
			clearInterval(interval);
			setTimeout(() => {
				visible = false;
			}, 500);
			const end = performance.now();
			const duration = end - start;
			load_durations = [...load_durations, duration];
		});
	});
</script>

{#if visible}
	<div
		class="fixed top-0 left-0 right-0 h-1 bg-primary z-50 transition-all duration-300 ease-in-out"
		style="width: {progress}%;"
	></div>
{/if}
