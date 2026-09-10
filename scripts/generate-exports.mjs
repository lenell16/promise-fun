// Generator for the promise-fun v2 re-export layer.
//
// Reads every runtime dependency's real export surface (live ESM import for
// runtime names + the TypeScript compiler API over its resolved `.d.ts` for
// the value/type split) and regenerates:
//   - src/index.ts            top-level named exports (camelCase keys, v1-compatible)
//   - src/<package>.ts        one file per dependency (backs the subpath exports)
//   - scripts/expected-exports.json  checked-in snapshot used by the parity test
//
// Re-run after any dependency bump: `npm run generate:exports`.
// The parity test fails when node_modules drift from the snapshot, which is
// the signal to re-run this script and review the diff.
//
// Naming rules (top level):
//   - default export  -> camelCased package name, e.g. p-limit -> pLimit
//   - named export X  -> <camel><X>, e.g. p-retry's AbortError -> pRetryAbortError
//   - values use `export`, type-only names use `export type` (verbatimModuleSyntax)
// Overrides for ugly mechanical names live in NAMED_OVERRIDES below.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const rootDirectory = path.dirname(
	path.dirname(fileURLToPath(import.meta.url)),
);
const sourceDirectory = path.join(rootDirectory, 'src');
const packageJsonPath = path.join(rootDirectory, 'package.json');
const snapshotPath = path.join(
	rootDirectory,
	'scripts',
	'expected-exports.json',
);
const modulesDirectory = path.join(rootDirectory, 'node_modules');

// Hand-picked top-level names where the mechanical <camel><Name> rule reads badly.
// Rule of thumb: when the upstream name already contains the package stem
// (pMapSkip, PProgress, …), keep it verbatim; when the stem repeats
// (limitFunction, TimeoutError, promiseStateAsync, …), shorten it.
const NAMED_OVERRIDES = {
	delay: {
		clearDelay: 'delayClear',
		createDelay: 'delayCreate',
		rangeDelay: 'delayRange',
	},
	'p-event': {
		pEventIterator: 'pEventIterator',
		pEventMultiple: 'pEventMultiple',
	},
	'p-filter': { pFilterIterable: 'pFilterIterable' },
	'p-limit': { limitFunction: 'pLimitFunction' },
	'p-map': { pMapIterable: 'pMapIterable', pMapSkip: 'pMapSkip' },
	'p-memoize': {
		pMemoizeClear: 'pMemoizeClear',
		pMemoizeDecorator: 'pMemoizeDecorator',
	},
	'p-progress': { PProgress: 'PProgress' },
	'p-props': { pPropsAllSettled: 'pPropsAllSettled' },
	'p-state': {
		promiseStateAsync: 'pStateAsync',
		promiseStateSync: 'pStateSync',
	},
	'p-timeout': { TimeoutError: 'pTimeoutError' },
};

// Dependencies that ship no `.d.ts`, with hand-authored subpath modules in
// src/<package>.ts (checked in, skipped by the subpath generator below).
// The index still re-exports them from the local file so dist/*.d.ts stays
// self-contained — a `from '<untyped dep>'` line in shipped types would break
// consumers that compile without `skipLibCheck`.
const HAND_AUTHOR_SUBPATHS = new Set(['p-break']);

// Extra type re-exports from hand-authored subpath modules:
// dependency -> [{local export name, top-level name}].
const HAND_AUTHOR_TYPES = {
	'p-break': [{ local: 'BreakFunction', top: 'pBreakFunction' }],
};

const toCamelCase = (name) =>
	name
		.split('-')
		.map((segment, index) =>
			index === 0 ? segment : segment[0].toUpperCase() + segment.slice(1),
		)
		.join('');
const capitalize = (name) => name[0].toUpperCase() + name.slice(1);

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const dependencyNames = Object.keys(packageJson.dependencies ?? {}).sort();

const compilerOptions = {
	module: ts.ModuleKind.NodeNext,
	moduleResolution: ts.ModuleResolutionKind.NodeNext,
	target: ts.ScriptTarget.ES2023,
	skipLibCheck: true,
};

function resolveTypeEntry(dependencyName) {
	const resolved = ts.resolveModuleName(
		dependencyName,
		path.join(rootDirectory, '__probe__.ts'),
		compilerOptions,
		ts.sys,
	);
	if (!resolved.resolvedModule) {
		throw new Error(`Could not resolve types for ${dependencyName}`);
	}

	return resolved.resolvedModule.resolvedFileName;
}

function listDeclarationExports(typeEntry) {
	const program = ts.createProgram([typeEntry], compilerOptions);
	const checker = program.getTypeChecker();
	const sourceFile = program.getSourceFile(typeEntry);
	const moduleSymbol = sourceFile?.symbol;
	if (!sourceFile || !moduleSymbol) {
		throw new Error(`No module symbol found in ${typeEntry}`);
	}

	const exportSymbols = checker.getExportsOfModule(moduleSymbol);
	// Note: getExportsOfModule resolves straight through `export =`, so CJS
	// typings are detected from the AST instead (their star re-export is
	// illegal under TS2498).
	const exportEquals = sourceFile.statements.some(
		(statement) => ts.isExportAssignment(statement) && statement.isExportEquals,
	);
	const names = { hasDefault: false, exportEquals, values: [], types: [] };

	for (const exportSymbol of exportSymbols) {
		if (exportSymbol.name === 'default') {
			names.hasDefault = true;
			continue;
		}

		if (exportSymbol.name === 'export=') {
			names.exportEquals = true;
			// CJS-style `export =` (also covers `module.exports =` typings):
			// the aliased entity acts as the default export, and its namespace
			// members (if any) are the named exports.
			names.hasDefault = true;
			const aliased = checker.getAliasedSymbol(exportSymbol);
			const members = aliased.exports ? [...aliased.exports.values()] : [];
			for (const member of members) {
				if (member.name === '__export') {
					continue;
				}

				const target =
					member.flags & ts.SymbolFlags.Alias
						? checker.getAliasedSymbol(member)
						: member;
				(target.flags & ts.SymbolFlags.Value ? names.values : names.types).push(
					member.name,
				);
			}

			continue;
		}

		if (exportSymbol.name === '__export') {
			continue;
		}

		const target =
			exportSymbol.flags & ts.SymbolFlags.Alias
				? checker.getAliasedSymbol(exportSymbol)
				: exportSymbol;
		(target.flags & ts.SymbolFlags.Value ? names.values : names.types).push(
			exportSymbol.name,
		);
	}

	names.values.sort();
	names.types.sort();
	return names;
}

const snapshot = {};
const warnings = [];

for (const dependencyName of dependencyNames) {
	const dependencyPackageJson = JSON.parse(
		readFileSync(
			path.join(modulesDirectory, dependencyName, 'package.json'),
			'utf8',
		),
	);
	const namespace = await import(dependencyName);
	const runtimeKeys = Object.keys(namespace)
		.filter((key) => key !== '__esModule')
		.sort();
	const runtimeHasDefault = runtimeKeys.includes('default');
	const runtimeNamed = runtimeKeys.filter((key) => key !== 'default');
	const typeEntry = resolveTypeEntry(dependencyName);
	const camelKey = toCamelCase(dependencyName);
	// Expected `typeof` of the top-level primary: the default export, the
	// matching primary named export, or the namespace object for the rest.
	const primaryType = runtimeHasDefault
		? typeof namespace.default
		: runtimeNamed.includes(camelKey)
			? typeof namespace[camelKey]
			: 'object';

	// Untyped dependency (type entry resolved to a `.js` file): trust the live
	// runtime surface for values; types come from the hand-authored subpath.
	if (!typeEntry.endsWith('.d.ts')) {
		snapshot[dependencyName] = {
			version: dependencyPackageJson.version,
			typeEntry: path.relative(
				path.join(rootDirectory, 'node_modules'),
				typeEntry,
			),
			untyped: true,
			camelKey,
			hasDefault: runtimeHasDefault,
			primaryType,
			defaultType: runtimeHasDefault ? typeof namespace.default : null,
			valueNamed: runtimeNamed,
			typeNamed: [],
			runtimeNamed,
		};
		if (!HAND_AUTHOR_SUBPATHS.has(dependencyName)) {
			warnings.push(
				`${dependencyName}: ships no types and has no hand-authored subpath; add one to HAND_AUTHOR_SUBPATHS`,
			);
		}

		continue;
	}

	const declared = listDeclarationExports(typeEntry);

	// Type-only names can never appear at runtime; value names must appear in
	// both worlds to be safely re-exported with an explicit `export {…}`.
	const runtimeSet = new Set(runtimeNamed);
	const declaredValueSet = new Set(declared.values);
	const safeValues = declared.values.filter((name) => runtimeSet.has(name));
	const typesOnly = declared.types.filter((name) => !runtimeSet.has(name));
	for (const name of declared.values.filter((name) => !runtimeSet.has(name))) {
		warnings.push(
			`${dependencyName}: .d.ts declares value '${name}' but it is missing at runtime (kept in subpath via export *, skipped at top level)`,
		);
	}

	for (const name of runtimeNamed.filter(
		(name) => !declaredValueSet.has(name) && !declared.types.includes(name),
	)) {
		warnings.push(
			`${dependencyName}: runtime export '${name}' is missing from .d.ts (skipped; cannot be typed)`,
		);
	}

	snapshot[dependencyName] = {
		version: dependencyPackageJson.version,
		typeEntry: path.relative(
			path.join(rootDirectory, 'node_modules'),
			typeEntry,
		),
		camelKey,
		hasDefault: runtimeHasDefault,
		exportEquals: declared.exportEquals,
		primaryType,
		defaultType: runtimeHasDefault ? typeof namespace.default : null,
		valueNamed: safeValues,
		typeNamed: typesOnly,
		runtimeNamed,
	};
}

mkdirSync(sourceDirectory, { recursive: true });

// --- src/<package>.ts (subpath modules: full upstream surface) ---
for (const dependencyName of dependencyNames) {
	const entry = snapshot[dependencyName];
	if (HAND_AUTHOR_SUBPATHS.has(dependencyName)) {
		continue;
	}

	const lines = [
		'// Generated by scripts/generate-exports.mjs — do not edit by hand.',
	];
	if (entry.hasDefault) {
		lines.push(`export {default} from '${dependencyName}';`);
	}

	// `export =` (CJS) typings cannot be star-re-exported (TS2498); these
	// packages expose no named members, so the default is the whole surface.
	if (!entry.exportEquals) {
		lines.push(`export * from '${dependencyName}';`);
	}

	lines.push('');
	writeFileSync(
		path.join(sourceDirectory, `${dependencyName}.ts`),
		lines.join('\n'),
	);
}

// --- src/index.ts (top-level named exports) ---
const usedTopLevelNames = new Set();
const claim = (name, origin) => {
	if (usedTopLevelNames.has(name)) {
		throw new Error(`Top-level name collision on '${name}' (from ${origin})`);
	}

	usedTopLevelNames.add(name);
};

const indexLines = [
	'// Generated by scripts/generate-exports.mjs — do not edit by hand.',
	'// Top-level named exports. CamelCase keys match the v1 API;',
	'// upstream named exports are forwarded under <camel><Name>.',
];
for (const dependencyName of dependencyNames) {
	const entry = snapshot[dependencyName];

	// Hand-authored subpath: re-export the value + declared types locally so
	// no `from '<untyped dep>'` line leaks into the shipped .d.ts files.
	if (HAND_AUTHOR_SUBPATHS.has(dependencyName)) {
		claim(entry.camelKey, `${dependencyName} (hand-authored default)`);
		indexLines.push(
			`export {default as ${entry.camelKey}} from './${dependencyName}.js';`,
		);
		entry.topLevel = {
			namespace: false,
			values: [{ from: 'default', to: entry.camelKey }],
			types: [],
		};
		for (const { local, top } of HAND_AUTHOR_TYPES[dependencyName] ?? []) {
			claim(top, `${dependencyName} (hand-authored type ${local})`);
			indexLines.push(
				`export type {${local} as ${top}} from './${dependencyName}.js';`,
			);
			entry.topLevel.types.push(top);
		}

		continue;
	}

	entry.topLevel = { namespace: false, values: [], types: [] };
	const valueParts = [];
	if (entry.hasDefault) {
		claim(entry.camelKey, `${dependencyName} (default)`);
		valueParts.push(`default as ${entry.camelKey}`);
		entry.topLevel.values.push({ from: 'default', to: entry.camelKey });
	} else if (entry.valueNamed.includes(entry.camelKey)) {
		// Named-only upstream whose primary export already matches the v1 key.
		claim(entry.camelKey, `${dependencyName} (primary named)`);
		valueParts.push(entry.camelKey);
		entry.topLevel.values.push({ from: entry.camelKey, to: entry.camelKey });
	} else {
		// Named-only upstream with no primary: expose the whole module under
		// the v1 key as a namespace (`pState.promiseStateAsync`) and forward
		// each member individually below.
		claim(entry.camelKey, `${dependencyName} (namespace)`);
		indexLines.push(`export * as ${entry.camelKey} from '${dependencyName}';`);
		entry.topLevel.namespace = true;
	}

	for (const name of entry.valueNamed) {
		if (!entry.hasDefault && name === entry.camelKey) {
			continue;
		}
		const topName =
			NAMED_OVERRIDES[dependencyName]?.[name] ??
			`${entry.camelKey}${capitalize(name)}`;
		claim(topName, `${dependencyName} (named value ${name})`);
		valueParts.push(name === topName ? name : `${name} as ${topName}`);
		entry.topLevel.values.push({ from: name, to: topName });
	}

	if (valueParts.length > 0) {
		indexLines.push(
			`export {${valueParts.join(', ')}} from '${dependencyName}';`,
		);
	}

	const typeParts = [];
	for (const name of entry.typeNamed) {
		const topName =
			NAMED_OVERRIDES[dependencyName]?.[name] ??
			`${entry.camelKey}${capitalize(name)}`;
		claim(topName, `${dependencyName} (named type ${name})`);
		typeParts.push(`${name} as ${topName}`);
		entry.topLevel.types.push(topName);
	}

	if (typeParts.length > 0) {
		indexLines.push(
			`export type {${typeParts.join(', ')}} from '${dependencyName}';`,
		);
	}
}

indexLines.push('');
writeFileSync(path.join(sourceDirectory, 'index.ts'), indexLines.join('\n'));
writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n');

// --- package.json subpath exports snippet ---
const exportsMap = {
	'.': { types: './dist/index.d.ts', import: './dist/index.js' },
};
for (const dependencyName of dependencyNames) {
	exportsMap[`./${dependencyName}`] = {
		types: `./dist/${dependencyName}.d.ts`,
		import: `./dist/${dependencyName}.js`,
	};
}

exportsMap['./package.json'] = './package.json';

console.log(`Audited ${dependencyNames.length} dependencies.`);
console.log(`Top-level names: ${usedTopLevelNames.size} (values + types).`);
if (warnings.length > 0) {
	console.log(`\nWarnings (${warnings.length}):`);
	for (const warning of warnings) {
		console.log(`  - ${warning}`);
	}
}

console.log('\nNamed (non-default) surfaces:');
for (const dependencyName of dependencyNames) {
	const entry = snapshot[dependencyName];
	if (entry.valueNamed.length > 0 || entry.typeNamed.length > 0) {
		console.log(
			`  ${dependencyName}: values=[${entry.valueNamed.join(', ')}] types=[${entry.typeNamed.join(', ')}]`,
		);
	}
}

console.log(
	'\nNo-default packages:',
	dependencyNames.filter((name) => !snapshot[name].hasDefault).join(', ') ||
		'(none)',
);
console.log('\n--- package.json "exports" snippet ---');
console.log(JSON.stringify(exportsMap, null, 2));

// Legacy node10-style resolvers ignore "exports", so subpath types need a
// "typesVersions" map or attw reports NoResolution for every subpath.
const typesVersions = { '*': {} };
for (const dependencyName of dependencyNames) {
	typesVersions['*'][dependencyName] = [`./dist/${dependencyName}.d.ts`];
}

console.log('\n--- package.json "typesVersions" snippet ---');
console.log(JSON.stringify(typesVersions, null, 2));
