<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import PageLoadingIndicator from "$lib/components/PageLoadingIndicator.svelte";

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<PageLoadingIndicator />
{@render children()}
