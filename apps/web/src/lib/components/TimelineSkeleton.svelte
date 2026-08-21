<script lang="ts">
	import { Skeleton } from "$lib/components/ui/skeleton";

	let { count = 8 }: { count?: number } = $props();
</script>

<div class="relative">
	<div class="absolute left-24 top-0 bottom-0 w-px bg-white/10"></div>

	{#each Array.from({ length: count }) as _, index (index)}
		<div class="mb-12">
			<div class="flex items-start gap-0">
				<div class="w-24 pr-4 pt-1 text-right">
					<Skeleton class="h-7 w-16 ml-auto" />
				</div>

				<div class="flex-1 pl-8 space-y-4">
					<div class="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
						<div class="flex items-start justify-between gap-3">
							<Skeleton class="h-5 w-3/4" />
							<Skeleton class="h-3 w-16 shrink-0" />
						</div>
						<Skeleton class="h-4 w-full" />
						<Skeleton class="h-4 w-5/6" />
						<div class="flex flex-wrap gap-1.5 pt-1">
							<Skeleton class="h-5 w-14 rounded-full" />
							<Skeleton class="h-5 w-16 rounded-full" />
						</div>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
