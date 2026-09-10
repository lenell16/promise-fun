import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import snapshot from '../scripts/expected-exports.json' with { type: 'json' };

const rootDirectory = path.join(import.meta.dirname, '..');
const distDirectory = path.join(rootDirectory, 'dist');
const distUrl = (file: string) =>
	pathToFileURL(path.join(distDirectory, file)).href;

// Guards against drift between node_modules and the generated re-export
// layer. When a dependency bump changes a surface, this test fails with the
// diff — re-run `npm run generate:exports` and review the result.
describe('parity with upstream surfaces', () => {
	it.each(Object.keys(snapshot))(
		'%s matches the snapshot and both entry points',
		async (dependency) => {
			const entry = snapshot[dependency as keyof typeof snapshot];
			const installed = JSON.parse(
				readFileSync(
					path.join(rootDirectory, 'node_modules', dependency, 'package.json'),
					'utf8',
				),
			) as { version: string };
			expect(installed.version, `${dependency} version`).toBe(entry.version);

			const live = (await import(dependency)) as Record<string, unknown>;
			const liveKeys = Object.keys(live)
				.filter((key) => key !== '__esModule')
				.sort();
			const snapshottedKeys = [
				...(entry.hasDefault ? ['default'] : []),
				...entry.runtimeNamed,
			].sort();
			expect(liveKeys, `${dependency} live surface`).toEqual(snapshottedKeys);

			const subpath = (await import(distUrl(`${dependency}.js`))) as Record<
				string,
				unknown
			>;
			expect(
				Object.keys(subpath).sort(),
				`${dependency} subpath surface`,
			).toEqual(liveKeys);
			for (const key of liveKeys) {
				expect(subpath[key], `${dependency} subpath identity: ${key}`).toBe(
					live[key],
				);
			}

			const main = (await import(distUrl('index.js'))) as Record<
				string,
				unknown
			>;
			for (const { from, to } of entry.topLevel.values) {
				expect(main[to], `${dependency} top-level identity: ${to}`).toBe(
					live[from],
				);
			}

			if (entry.topLevel.namespace) {
				const namespace = main[entry.camelKey] as Record<string, unknown>;
				for (const key of entry.runtimeNamed) {
					expect(
						namespace[key],
						`${dependency} namespace identity: ${key}`,
					).toBe(live[key]);
				}
			}
		},
	);
});
