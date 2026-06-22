<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Edit Event — Admin</title></svelte:head>

<a href="/admin" class="text-white/40 hover:text-white text-sm mb-6 inline-block">← Dashboard</a>

<h1 class="text-2xl font-bold mb-6">Edit Event</h1>

<form method="POST" action="?/update" class="space-y-5 max-w-2xl">
	<div>
		<label class="block text-sm text-white/60 mb-1" for="title">Title</label>
		<input
			id="title"
			name="title"
			value={data.event.title}
			class="w-full bg-[#1a1a1a] border border-white/20 rounded px-3 py-2 text-white text-sm"
			required
		/>
	</div>

	<div>
		<label class="block text-sm text-white/60 mb-1" for="description">Description</label>
		<textarea
			id="description"
			name="description"
			rows="6"
			class="w-full bg-[#1a1a1a] border border-white/20 rounded px-3 py-2 text-white text-sm resize-y"
		>{data.event.description ?? ''}</textarea>
	</div>

	<div>
		<label class="block text-sm text-white/60 mb-1" for="imageUrl">Image URL</label>
		<input
			id="imageUrl"
			name="imageUrl"
			value={data.event.imageUrl ?? ''}
			class="w-full bg-[#1a1a1a] border border-white/20 rounded px-3 py-2 text-white text-sm"
		/>
	</div>

	<div>
		<label class="block text-sm text-white/60 mb-1" for="sourceUrl">Source URL</label>
		<input
			id="sourceUrl"
			name="sourceUrl"
			value={data.event.sourceUrl ?? ''}
			class="w-full bg-[#1a1a1a] border border-white/20 rounded px-3 py-2 text-white text-sm"
		/>
	</div>

	<div class="pt-2">
		<button type="submit" class="px-5 py-2 bg-white text-black rounded font-medium hover:bg-white/90 text-sm">
			Save Changes
		</button>
	</div>
</form>
