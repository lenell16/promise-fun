import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import snapshot from '../scripts/expected-exports.json' with { type: 'json' };

const distDirectory = path.join(import.meta.dirname, '..', 'dist');
const distUrl = (file: string) =>
	pathToFileURL(path.join(distDirectory, file)).href;

describe('top-level entry', () => {
	it('exposes every dependency under its camelCase key with the audited type', async () => {
		const main = (await import(distUrl('index.js'))) as Record<string, unknown>;
		for (const [dependency, entry] of Object.entries(snapshot)) {
			expect(
				main[entry.camelKey],
				`${dependency} -> ${entry.camelKey}`,
			).toBeDefined();
			expect(typeof main[entry.camelKey], `${dependency} typeof`).toBe(
				entry.primaryType,
			);
		}
	});

	it('forwards every audited named value export', async () => {
		const main = (await import(distUrl('index.js'))) as Record<string, unknown>;
		for (const [dependency, entry] of Object.entries(snapshot)) {
			for (const { to } of entry.topLevel.values) {
				expect(main[to], `${dependency} -> ${to}`).toBeDefined();
			}
		}
	});

	it('has no default export and no removed v1 keys', async () => {
		const main = (await import(distUrl('index.js'))) as Record<string, unknown>;
		expect('default' in main).toBe(false);
		expect('pFinally' in main).toBe(false);
	});
});

describe('subpath entries', () => {
	it.each(Object.keys(snapshot))(
		'imports %s with a usable surface',
		async (dependency) => {
			const entry = snapshot[dependency as keyof typeof snapshot];
			const subpath = (await import(distUrl(`${dependency}.js`))) as Record<
				string,
				unknown
			>;
			expect(Object.keys(subpath).length).toBeGreaterThan(0);
			if (entry.hasDefault) {
				expect(subpath.default, `${dependency} default`).toBeDefined();
			}

			for (const name of entry.runtimeNamed) {
				expect(subpath[name], `${dependency} -> ${name}`).toBeDefined();
			}
		},
	);
});
