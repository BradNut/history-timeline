// Bundles the migrate/seed entrypoints into plain ESM so the production image can run
// them with `node` alone. Mirrors adapter-node: packages in `dependencies` stay external
// (installed in the runtime image); everything else (drizzle-orm, better-auth, dotenv)
// is inlined, so devDependencies and their toolchains never ship.
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const scriptsDir = 'src/lib/server/databases/postgres';

await build({
	entryPoints: [`${scriptsDir}/migrate.ts`, `${scriptsDir}/seed.ts`],
	outdir: 'dist/scripts',
	outExtension: { '.js': '.mjs' },
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node24',
	external: Object.keys(pkg.dependencies ?? {}),
	// Inlined CommonJS packages (e.g. dotenv) call require() for Node built-ins.
	banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
	logLevel: 'info'
});
