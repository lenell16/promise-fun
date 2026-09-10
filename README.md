# promise-fun

One install for the [promise-fun](https://github.com/sindresorhus/promise-fun) universe: 53 promise utility packages as named ESM exports with full TypeScript types.

- **Pure ESM**, Node.js >= 22
- **Tree-shakeable**: import the barrel or a single helper via subpaths
- **Typed**: upstream types re-exported, never rewritten (`attw` clean)

## Install

```sh
npm install promise-fun
```

## Usage

```js
import { pMap, pRetry, pRetryAbortError } from 'promise-fun';

const results = await pMap(urls, fetchWithLimit, { concurrency: 4 });
```

Prefer a single helper without the barrel? Every package has a subpath that mirrors its upstream API exactly (including the original export names):

```js
import pLimit, { limitFunction } from 'promise-fun/p-limit';
import { promiseStateSync } from 'promise-fun/p-state';
```

### Migrating from v1

```js
// v1 (CommonJS)
// const {pMap} = require('promise-fun');

// v2 (ESM)
import { pMap } from 'promise-fun';
```

Breaking changes: ESM-only (`require()` no longer works), Node.js >= 22, the top level has no default export, `p-finally` was dropped (use native `Promise.prototype.finally`), and every dependency moved to its current major — see [CHANGELOG.md](CHANGELOG.md) for the full list.

## Exports

Top-level keys are the camelCased package names (stable since v1). When an upstream package has named exports, they are forwarded under `<camel><Name>` (e.g. `p-retry`'s `AbortError` → `pRetryAbortError`); a few redundant stems are shortened (`p-limit`'s `limitFunction` → `pLimitFunction`) and names that already contain the stem are kept verbatim (`pMapSkip`). Every upstream type is forwarded the same way (`pMapOptions`, `pRetryOptions`, …). The subpath always carries the canonical upstream names.

### Main list

| Package                                                              | Key               | Notes                                                                                                                          |
| -------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [delay](https://github.com/sindresorhus/delay)                       | `delay`           | + `delayCreate`, `delayClear`, `delayRange`                                                                                    |
| [make-synchronous](https://github.com/sindresorhus/make-synchronous) | `makeSynchronous` | **New in v2.** Runs async functions synchronously via worker threads; check platform support                                   |
| [p-all](https://github.com/sindresorhus/p-all)                       | `pAll`            | Run promise-returning functions concurrently                                                                                   |
| [p-any](https://github.com/sindresorhus/p-any)                       | `pAny`            | + `pAnyAggregateError`                                                                                                         |
| [p-cancelable](https://github.com/sindresorhus/p-cancelable)         | `pCancelable`     | + `pCancelableCancelError`                                                                                                     |
| [p-debounce](https://github.com/sindresorhus/p-debounce)             | `pDebounce`       | Debounce async functions                                                                                                       |
| [p-defer](https://github.com/sindresorhus/p-defer)                   | `pDefer`          | Deferred promise                                                                                                               |
| [p-do-whilst](https://github.com/sindresorhus/p-do-whilst)           | `pDoWhilst`       | Do…while for promises                                                                                                          |
| [p-each-series](https://github.com/sindresorhus/p-each-series)       | `pEachSeries`     | Iterate promises serially                                                                                                      |
| [p-event](https://github.com/sindresorhus/p-event)                   | `pEvent`          | Upstream is named-exports-only; + `pEventIterator`, `pEventMultiple`, `pEventTimeoutError`                                     |
| [p-filter](https://github.com/sindresorhus/p-filter)                 | `pFilter`         | + `pFilterIterable`                                                                                                            |
| [p-forever](https://github.com/sindresorhus/p-forever)               | `pForever`        | Run repeatedly until ended                                                                                                     |
| [p-immediate](https://github.com/sindresorhus/p-immediate)           | `pImmediate`      | Resolve on the next tick                                                                                                       |
| [p-is-promise](https://github.com/sindresorhus/p-is-promise)         | `pIsPromise`      | Check whether a value is a promise                                                                                             |
| [p-lazy](https://github.com/sindresorhus/p-lazy)                     | `pLazy`           | Lazy promise                                                                                                                   |
| [p-limit](https://github.com/sindresorhus/p-limit)                   | `pLimit`          | Concurrency limiter + `pLimitFunction`                                                                                         |
| [p-locate](https://github.com/sindresorhus/p-locate)                 | `pLocate`         | First promise satisfying a tester                                                                                              |
| [p-map](https://github.com/sindresorhus/p-map)                       | `pMap`            | Map concurrently + `pMapIterable`, `pMapSkip`                                                                                  |
| [p-map-series](https://github.com/sindresorhus/p-map-series)         | `pMapSeries`      | Map serially                                                                                                                   |
| [p-memoize](https://github.com/sindresorhus/p-memoize)               | `pMemoize`        | + `pMemoizeClear`, `pMemoizeDecorator`                                                                                         |
| [p-min-delay](https://github.com/sindresorhus/p-min-delay)           | `pMinDelay`       | Delay a promise a minimum amount of time                                                                                       |
| [p-mutex](https://github.com/sindresorhus/p-mutex)                   | `pMutex`          | **New in v2.** Mutual exclusion for async functions                                                                            |
| [p-pipe](https://github.com/sindresorhus/p-pipe)                     | `pPipe`           | Compose functions into a pipeline                                                                                              |
| [p-progress](https://github.com/sindresorhus/p-progress)             | `pProgress`       | **New in v2** (it was already listed in the v1 readme but never wired up). + `PProgress` class                                 |
| [p-props](https://github.com/sindresorhus/p-props)                   | `pProps`          | `Promise.all` for objects and maps + `pPropsAllSettled`                                                                        |
| [p-queue](https://github.com/sindresorhus/p-queue)                   | `pQueue`          | Promise queue + `pQueuePriorityQueue`, `pQueueTimeoutError`                                                                    |
| [p-race](https://github.com/sindresorhus/p-race)                     | `pRace`           | A better `Promise.race`                                                                                                        |
| [p-reduce](https://github.com/sindresorhus/p-reduce)                 | `pReduce`         | Reduce with promises                                                                                                           |
| [p-reflect](https://github.com/sindresorhus/p-reflect)               | `pReflect`        | + `pReflectIsFulfilled`, `pReflectIsRejected`                                                                                  |
| [p-retry](https://github.com/sindresorhus/p-retry)                   | `pRetry`          | Retry + `pRetryAbortError`, `pRetryMakeRetriable`. Note: the `forever` option was removed upstream                             |
| [p-series](https://github.com/sindresorhus/p-series)                 | `pSeries`         | Run promise-returning functions in series                                                                                      |
| [p-settle](https://github.com/sindresorhus/p-settle)                 | `pSettle`         | + `pSettleIsFulfilled`, `pSettleIsRejected`                                                                                    |
| [p-some](https://github.com/sindresorhus/p-some)                     | `pSome`           | + `pSomeFilterError`, `pSomePEvery`                                                                                            |
| [p-state](https://github.com/sindresorhus/p-state)                   | `pState`          | **New in v2.** Named-exports-only upstream: `pState` is a namespace (`pState.promiseStateAsync`) + `pStateAsync`, `pStateSync` |
| [p-throttle](https://github.com/sindresorhus/p-throttle)             | `pThrottle`       | Throttle async functions                                                                                                       |
| [p-time](https://github.com/sindresorhus/p-time)                     | `pTime`           | Measure how long a promise takes                                                                                               |
| [p-timeout](https://github.com/sindresorhus/p-timeout)               | `pTimeout`        | Timeout with `AbortSignal` + `pTimeoutError`                                                                                   |
| [p-times](https://github.com/sindresorhus/p-times)                   | `pTimes`          | Run N times concurrently                                                                                                       |
| [p-try](https://github.com/sindresorhus/p-try)                       | `pTry`            | `Promise.try` ponyfill                                                                                                         |
| [p-wait-for](https://github.com/sindresorhus/p-wait-for)             | `pWaitFor`        | Wait for a condition + `pWaitForTimeoutError`                                                                                  |
| [p-waterfall](https://github.com/sindresorhus/p-waterfall)           | `pWaterfall`      | Series, each passing its result to the next                                                                                    |
| [p-whilst](https://github.com/sindresorhus/p-whilst)                 | `pWhilst`         | While-loop for promises                                                                                                        |
| [pify](https://github.com/sindresorhus/pify)                         | `pify`            | Promisify callback-style functions                                                                                             |
| [yoctodelay](https://github.com/sindresorhus/yoctodelay)             | `yoctodelay`      | **New in v2.** Tiny `delay` alternative                                                                                        |

### `.then`/`.catch`-based packages (generally avoid)

Upstream groups these separately — prefer `async`/`await` over chaining helpers:

| Package                                                  | Key        |
| -------------------------------------------------------- | ---------- |
| [p-break](https://github.com/sindresorhus/p-break)       | `pBreak`   |
| [p-catch-if](https://github.com/sindresorhus/p-catch-if) | `pCatchIf` |
| [p-if](https://github.com/sindresorhus/p-if)             | `pIf`      |
| [p-log](https://github.com/sindresorhus/p-log)           | `pLog`     |
| [p-tap](https://github.com/sindresorhus/p-tap)           | `pTap`     |

### Legacy (kept for back-compat)

No longer listed upstream, still shipped here so v1 imports keep working:

| Package                                                          | Key             |
| ---------------------------------------------------------------- | --------------- |
| [hard-rejection](https://github.com/sindresorhus/hard-rejection) | `hardRejection` |
| [loud-rejection](https://github.com/sindresorhus/loud-rejection) | `loudRejection` |
| [p-every](https://github.com/kevva/p-every)                      | `pEvery`        |
| [p-one](https://github.com/kevva/p-one)                          | `pOne`          |

Removed in v2: [p-finally](https://github.com/sindresorhus/p-finally) (deprecated on npm — use native `Promise.prototype.finally`).

## TypeScript

Types come straight from the upstream packages:

```ts
import { pMap, type pMapOptions } from 'promise-fun';

const options: pMapOptions = { concurrency: 2 };
await pMap(urls, fetchOne, options);
```

One exception: `p-break@2` ships no types, so this package declares its surface (`src/p-break.ts`, exported as `pBreak` / `pBreakFunction`) from the upstream readme and source.

## Requirements

- Node.js >= 22
- ESM (`import`). CommonJS `require()` is not supported — a CJS wrapper is impossible since every dependency is ESM-only.

## Development

```sh
npm install
npm test        # build + vitest (smoke + parity) + type tests
npm run lint    # eslint + prettier
npx publint && npx attw --pack .
```

The re-export layer is generated: after any dependency bump, run `npm run generate:exports` and review the diff to `src/` and `scripts/expected-exports.json`. The parity test fails when `node_modules` drift from the snapshot — that is the signal to regenerate.

## License

MIT — see [LICENSE](LICENSE).
