import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { importLogs } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { runDailyImport, runFullImport } from '$lib/server/import-actions';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const logs = await db
		.select()
		.from(importLogs)
		.orderBy(desc(importLogs.startedAt))
		.limit(10);

	return { logs };
};

export const actions: Actions = {
	runDaily: async ({ locals }) => {
		const result = await runDailyImport(locals.user?.role);
		if (!result.ok) return fail(result.error.status, { error: result.error.message });
		return { success: true, ...result.data };
	},

	runFull: async ({ locals }) => {
		const result = await runFullImport(locals.user?.role);
		if (!result.ok) return fail(result.error.status, { error: result.error.message });
		return { success: true, ...result.data };
	}
};
