// Static type tests for the shipped `dist/*.d.ts` (checked with
// `npm run test:types`, never executed). Asserts that the top level and the
// subpaths resolve the real upstream types, including renamed named-exports.
import { expectTypeOf } from 'vitest';
import {
	delayCreate,
	pBreak,
	pEvent,
	pEventIterator,
	pLimit,
	pLimitFunction,
	pMap,
	PProgress,
	pRetryAbortError,
	pRetryMakeRetriable,
	pState,
	pStateAsync,
	pStateSync,
} from '../dist/index.js';
import type {
	pBreakFunction,
	pMapOptions,
	pStatePromiseState,
} from '../dist/index.js';
import pLimitDefault, { limitFunction } from '../dist/p-limit.js';
import { promiseStateSync } from '../dist/p-state.js';

// Default-export values keep their upstream call signatures.
expectTypeOf(pMap).toBeFunction();
const mapped: Promise<number[]> = pMap([1, 2, 3], async (number) => number * 2);
expectTypeOf(mapped).toEqualTypeOf<Promise<number[]>>();
const mapOptions: pMapOptions = { concurrency: 2 };
expectTypeOf(mapOptions.concurrency).toEqualTypeOf<number | undefined>();

const limit = pLimit(2);
expectTypeOf(limit).toBeFunction();

// Renamed named-exports resolve to the same types as the subpath originals.
expectTypeOf(pLimitDefault).toEqualTypeOf(pLimit);
expectTypeOf(limitFunction).toEqualTypeOf(pLimitFunction);
expectTypeOf(promiseStateSync).toEqualTypeOf(pStateSync);

// Error classes and helpers.
const abortError = new pRetryAbortError('stop');
expectTypeOf(abortError).toMatchTypeOf<Error>();
expectTypeOf(pRetryMakeRetriable).toBeFunction();
expectTypeOf(delayCreate).toBeFunction();

// Named-only upstream: primary export, namespace object, and members agree.
expectTypeOf(pEvent).toBeFunction();
expectTypeOf(pEventIterator).toBeFunction();
expectTypeOf(pState.promiseStateAsync).toBeFunction();
expectTypeOf(pStateAsync).toBeFunction();
expectTypeOf(pStateSync).toBeFunction();
const state: pStatePromiseState = 'fulfilled';
expectTypeOf(state).not.toBeAny();

// Class export preserved under its canonical name.
const progress = new PProgress<string>(async () => 'done');
const progressAsPromise: Promise<string> = progress;
expectTypeOf(progressAsPromise).not.toBeAny();
expectTypeOf(progress.progress).toBeNumber();

// Hand-authored p-break types (upstream ships none).
expectTypeOf(pBreak).toEqualTypeOf<pBreakFunction>();
const ended: Promise<unknown> = pBreak.end(new Error('x'));
expectTypeOf(ended).toEqualTypeOf<Promise<unknown>>();
