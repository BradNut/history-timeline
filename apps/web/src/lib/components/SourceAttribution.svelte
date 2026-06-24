<script lang="ts">
	let { class: className = "" }: { class?: string } = $props();
</script>

<footer class="border-t border-white/10 text-white/40 text-xs leading-relaxed {className}">
	<div class="max-w-4xl mx-auto px-4 py-6 space-y-1">
		<p>
			Historical content is sourced from the
			<a
				href="https://en.wikipedia.org/api/rest_v1/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-white/60 hover:text-white underline underline-offset-2"
				>Wikipedia "On This Day" API</a
			>. Text excerpts are from
			<a
				href="https://www.wikipedia.org/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-white/60 hover:text-white underline underline-offset-2">Wikipedia</a
			>
			and may have been shortened or otherwise modified for display.
		</p>
		<p>
			Wikipedia text is licensed under
			<a
				href="https://creativecommons.org/licenses/by-sa/4.0/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-white/60 hover:text-white underline underline-offset-2"
				>Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)</a
			>. Images retain their original licenses as listed on their Wikipedia file
			pages. This site's source code is licensed under MIT.
		</p>
	</div>
</footer>
