import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	},
	resolve: {
		alias: {
			$lib: resolve(__dirname, 'src/lib'),
			'$env/dynamic/private': resolve(__dirname, 'src/test-mocks/env-dynamic-private.ts'),
			'$app/server': resolve(__dirname, 'src/test-mocks/app-server.ts'),
			'$app/environment': resolve(__dirname, 'src/test-mocks/app-environment.ts')
		}
	}
});
