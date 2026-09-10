// Hand-authored: p-break@2 ships no types, so the surface is declared here
// from the upstream readme + source instead of re-exported. Keep in sync
// with the installed p-break version (see scripts/expected-exports.json).
// The runtime value is still the upstream default export, so the subpath
// module namespace matches `import 'p-break'` exactly.
import upstreamBreak from 'p-break';

export interface BreakFunction {
	(value?: unknown): Promise<never>;
	end: (error: unknown) => Promise<unknown>;
}

const pBreak: BreakFunction = upstreamBreak as BreakFunction;

export default pBreak;
