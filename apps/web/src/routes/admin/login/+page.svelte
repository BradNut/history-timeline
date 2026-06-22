<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Admin Sign In — History Timeline</title></svelte:head>

<div class="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
	<div class="w-full max-w-sm">
		<h1 class="text-xl font-semibold text-white mb-8 text-center">Admin Sign In</h1>

		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
			class="flex flex-col gap-4"
		>
			{#if form?.error}
				<div class="px-3 py-2 rounded bg-red-900/40 border border-red-500/30 text-red-400 text-sm">
					{form.error}
				</div>
			{/if}

			<div class="flex flex-col gap-1.5">
				<label for="email" class="text-xs text-white/50 uppercase tracking-wider">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					autocomplete="email"
					class="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-white/20"
					placeholder="admin@example.com"
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label for="password" class="text-xs text-white/50 uppercase tracking-wider">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="current-password"
					class="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
				/>
			</div>

			<button
				type="submit"
				disabled={submitting}
				class="mt-2 px-4 py-2 bg-white text-black rounded font-medium text-sm hover:bg-white/90 disabled:opacity-50 transition-colors"
			>
				{submitting ? 'Signing in…' : 'Sign In'}
			</button>
		</form>
	</div>
</div>
