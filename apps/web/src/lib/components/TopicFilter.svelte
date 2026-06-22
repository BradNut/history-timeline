<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Badge } from '$lib/components/ui/badge';

	type Topic = { id: number; name: string; slug: string };

	let { topics, activeSlug }: { topics: Topic[]; activeSlug: string | null } = $props();

	function toggle(slug: string) {
		const params = new URLSearchParams(page.url.searchParams);
		if (activeSlug === slug) {
			params.delete('topic');
		} else {
			params.set('topic', slug);
		}
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}
</script>

<div class="flex flex-wrap gap-2">
	{#each topics as topic}
		<button onclick={() => toggle(topic.slug)} class="cursor-pointer">
			<Badge variant={activeSlug === topic.slug ? 'default' : 'outline'}>
				{topic.name}
			</Badge>
		</button>
	{/each}
</div>
