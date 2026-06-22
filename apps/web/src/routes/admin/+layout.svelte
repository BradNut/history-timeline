<script lang="ts">
	import { enhance } from "$app/forms";
	let { children } = $props();
</script>

<div class="min-h-screen bg-[#0a0a0a] text-white">
	<header class="border-b border-white/10 bg-[#111]">
		<div class="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
			<a href="/" class="text-white/50 hover:text-white text-sm">← Timeline</a>
			<span class="text-white font-semibold">Admin</span>
			<nav class="flex gap-4 ml-auto items-center">
				<a href="/admin" class="text-white/60 hover:text-white text-sm"
					>Dashboard</a
				>
				<a href="/admin/unmapped" class="text-white/60 hover:text-white text-sm"
					>Unmapped</a
				>
				<a href="/admin/taxonomy" class="text-white/60 hover:text-white text-sm"
					>Taxonomy</a
				>
				<form method="POST" action="/admin/signout" use:enhance>
					<button
						type="submit"
						class="text-white/40 hover:text-white text-sm ml-2">Sign out</button
					>
				</form>
			</nav>
		</div>
	</header>
	<main class="max-w-5xl mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>
