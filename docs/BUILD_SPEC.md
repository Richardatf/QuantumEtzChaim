# Quantum Etz Chaim / IvritOS Build Specification

**Contract:** `qec-build-0.3`

**Status:** integrated shared-engine prototype

**Updated:** 2026-07-19

## 1. Build objective

Build a deterministic Hebrew-letter virtual machine whose state transitions can be replayed, inspected, and exported. Quantum Etz Chaim is the architecture and public atlas; IvritOS owns orchestration; IvritCode supplies instructions; the Observatory and Living Tree Console present the same trace.

This is a software simulation. Coherence values are seeded visualization data—not qubit amplitudes or physical quantum computation. Symbolic descriptions are project conventions, not claims of religious authority.

## 2. Deliverable boundary

### In scope for kernel 0.3

- NFC-normalized Hebrew input and explicit reporting of unsupported marks.
- Exactly 22 visible base-22 registers and one hidden Aleph Olam orientation register.
- Versioned instruction-to-path configuration.
- Pure, deterministic register transforms.
- Ordered service, path, gate, coherence, observation, and manifestation events.
- Byte-stable JSON exports for identical inputs, configuration, and seeds.
- A browser console that consumes the same contracts as tests.

### Explicitly out of scope

- Physical qubit control, quantum speed-up, hardware calibration, or error correction.
- Arbitrary native or generated-code execution.
- Network access during instruction execution.
- Mutable permissions within a run unless represented by a signed transition event.
- Treating an interpretive or symbolic label as computed evidence.

## 3. Runtime topology

```text
UTF-8 source
    │
    ▼
Unicode adapter ──► parser/compiler ──► policy gate
                                            │
                                            ▼
                                     immutable run context
                                            │
                    ┌───────────────────────┴──────────────────────┐
                    ▼                                              ▼
          Sefirotic service plane                        Letter-state reducer
          intent / route / policy                       23 fixed registers
                    │                                              │
                    └───────────────────────┬──────────────────────┘
                                            ▼
                                      append-only trace
                         path → gate → coherence → observation
                                            │
                                            ▼
                                  Malchut render / JSON export
```

The classical reducer is authoritative. The coherence projector reads completed deterministic state and may annotate a trace; it cannot alter the classical result.

## 4. Package and ownership plan

| Package           | Public responsibility                                                        | Must not own       |
| ----------------- | ---------------------------------------------------------------------------- | ------------------ |
| `@ivritcode/core` | Hebrew normalization, instruction registry, deterministic transforms         | DOM or network I/O |
| `@qec/core`       | Machine orchestration, seeded execution, trace generation, manifestation     | Presentation state |
| `@qec/spec`       | Versioned schemas, path maps, identifiers, exchange and validation contracts | Runtime mutation   |

Dependency direction is one-way: UI → `@qec/core` → `@ivritcode/core`, with both layers bound by `@qec/spec`. Quantum Etz Chaim consumes these canonical IvritCode packages and does not maintain a duplicate machine implementation.

## 5. Normative state contracts

```ts
type Base22Digit = number & { readonly __base22: unique symbol };
type RegisterIndex = number & { readonly __registerIndex: unique symbol };

interface LetterRegister {
  readonly index: RegisterIndex; // 0..22
  readonly symbol: string; // Hebrew letter or א∞
  readonly value: Base22Digit; // 0..21
  readonly hidden: boolean;
}

interface MachineState {
  readonly schema: "qec-machine-state-0.3";
  readonly registers: readonly LetterRegister[]; // length === 23
  readonly instructionPointer: number;
  readonly halted: boolean;
}

interface RunContext {
  readonly runId: string; // derived; never random
  readonly programHash: string;
  readonly architectureVersion: string;
  readonly pathMapVersion: string;
  readonly seed: number;
  readonly mode: "classical" | "coherence";
  readonly limits: ExecutionLimits;
  readonly permissions: readonly Permission[];
}

interface TraceEvent<TType extends string, TPayload> {
  readonly sequence: number;
  readonly type: TType;
  readonly instructionIndex: number;
  readonly beforeHash: string;
  readonly afterHash: string;
  readonly payload: Readonly<TPayload>;
}
```

### State invariants

1. Register count is always 23: 22 visible plus one hidden.
2. Every value is an integer in `[0, 21]`.
3. Register objects, contexts, events, and histories are immutable.
4. Aleph Olam may orient a transform; it may not overwrite all visible registers with one value.
5. Each event sequence increases by exactly one.
6. Every `beforeHash` matches the preceding `afterHash`.
7. Rendering and coherence projection never mutate machine state.

## 6. Service-plane interfaces

| Region   | Interface                    | Input                   | Required output                            |
| -------- | ---------------------------- | ----------------------- | ------------------------------------------ |
| Keter    | `KeterService.begin`         | compiled program, seed  | immutable intent and run identity          |
| Chokhmah | `ChokhmahService.propose`    | instruction, state      | ordered transform candidates               |
| Binah    | `BinahCompiler.compile`      | normalized graphemes    | AST plus diagnostics                       |
| Da’at    | `DaatObserver.observe`       | completed candidate set | one deterministic projection and snapshot  |
| Chesed   | `ChesedAllocator.allocate`   | request, limits         | bounded grant or typed refusal             |
| Gevurah  | `GevurahPolicy.authorize`    | operation, permissions  | allow/deny decision with code              |
| Tiferet  | `TiferetScheduler.reconcile` | service results         | ordered commit plan and consistency result |
| Netzach  | `NetzachRuntime.advance`     | state, instruction      | next immutable state                       |
| Hod      | `HodInterface.describe`      | trace                   | diagnostics and serialized views           |
| Yesod    | `YesodBus.append`            | validated event         | new append-only history                    |
| Malchut  | `MalchutOutput.manifest`     | observed state          | text, sound descriptor, or export payload  |

Service calls return values; they do not share mutable singletons. All failures use typed codes such as `E_PARSE_MARK`, `E_PATH_MISSING`, `E_POLICY_DENIED`, `E_STEP_LIMIT`, and `E_TRACE_DIVERGENCE`.

## 7. Instruction transaction

Each instruction is one atomic transaction:

1. **Parse** — Binah emits an instruction or a positioned diagnostic.
2. **Authorize** — Gevurah checks operation, permission, step, memory, and output limits.
3. **Bind context** — Keter supplies program identity, versions, seed, and intent.
4. **Resolve path** — load exactly one versioned path record for the instruction.
5. **Dispatch services** — source and destination services return deterministic results.
6. **Reduce state** — runtime applies one pure Letter Plane transform.
7. **Append trace** — Yesod records hashes, route, changed registers, and service results.
8. **Project coherence** — Tiferet derives bounded optional visualization values.
9. **Observe** — Da’at ranks named projections and records exactly one selection when required.
10. **Manifest** — Malchut renders only an observed state and emits a versioned export.

If any stage fails, no partial state is committed. The failure itself is appended only when a valid trace envelope can be produced.

## 8. Versioned event envelope

Every exported run uses `qec-trace-0.3` and contains:

```json
{
  "schema": "qec-trace-0.3",
  "run": { "programHash": "…", "seed": 9, "mode": "coherence" },
  "initialStateHash": "…",
  "events": [],
  "observation": { "strategy": "register-order", "snapshotHash": "…" },
  "manifestation": { "letters": "אור", "checksum": "…" }
}
```

Canonical JSON uses UTF-8, lexicographically ordered object keys, no insignificant whitespace, and decimal numbers only. Hash inputs exclude presentation labels and wall-clock timestamps.

### Published schema pack

The repository publishes Draft 2020-12 schemas under `specifications/schemas/` for machine state, path maps, traces, observations, and manifestation exports. Tests compile every schema, validate the implemented `אור` path fixture and a real manifestation export, and verify that out-of-range data fails closed.

## 9. Configuration contracts

The path map is data, not application code. A valid map must declare:

- schema and semantic version;
- all 22 Hebrew instruction keys exactly once;
- source and destination Sefirotic regions;
- transform identifier and transform version;
- rationale labeled as project convention;
- compatibility range for the kernel;
- checksum of canonicalized contents.

Startup fails closed on missing paths, duplicates, unknown services, invalid transforms, incompatible versions, or checksum mismatch.

The architecture candidate is published as `specifications/qec-paths-v0.3.json`. It covers all 22 Hebrew letters in canonical order. Each entry names its Sefirotic route, operation, transform ID/version, service owners, and project-convention rationale. Its SHA-256 digest covers the canonical JSON representation of the `paths` array. The smaller `qec-or-paths-v0.1.json` fixture remains the implemented executable subset.

Kernel 0.3 now loads that complete map into a 22-entry transform registry. `runProgram(source, seed)` accepts arbitrary mapped Hebrew programs, normalizes NFC and final letter forms (`ךםןףץ`), enforces the 1,024-instruction ceiling, composes adjacent gates, and returns the same deterministic observation and manifestation structures used by the `אור` console. `runOrVerticalSlice` remains as a compatibility wrapper.

The Living Tree Console exposes this engine through the IvritCode Program Lab. It reports normalized source, path/gate counts, Da’at selection, checksum, and the complete resolved route. Submitting a valid program installs that run in the instruction stepper, Tree highlighting, Gate Explorer, seed comparison, observation boundary, and manifestation inspector. A permalink records normalized source and seed as URL parameters and restores the run after reload. Invalid or oversized permalink state falls back safely to canonical `אור` seed 09. Invalid source produces a typed rejection message and explicitly confirms that no partial state was committed.

The Trace Comparator keeps one complete run as a pinned baseline and compares it with the active run. Its deterministic diff reports the common path prefix, changed final registers, path/gate count deltas, final coherence delta, Da’at selection change, and manifestation checksum transition. A first-divergence inspector identifies the earliest mismatched instruction boundary, classifies the cause, shows both routes and transform IDs, compares state hashes, and lists changed register indices. Pinning replaces the baseline without mutating either trace.

## 10. Determinism and seed behavior

For equal source bytes, normalized program, initial state, configuration versions, permissions, limits, mode, and seed, the trace export must be byte-identical.

- No wall-clock time, ambient locale, unordered iteration, or system randomness enters computation.
- Seeds are explicit unsigned 32-bit integers.
- Seed changes may rotate or permute visible values but must preserve base-22 bounds.
- The canonical seed 09 keeps all 22 visible values distinct.
- Coherence values satisfy `activation ∈ [0,1]`, `phase ∈ [0,2π]`, and `coherence ∈ [0,1]`.

## 11. Safety limits

| Limit            | Prototype default | Failure                |
| ---------------- | ----------------: | ---------------------- |
| Source graphemes |             4,096 | `E_SOURCE_LIMIT`       |
| Instructions     |             1,024 | `E_PROGRAM_LIMIT`      |
| Execution steps  |            10,000 | `E_STEP_LIMIT`         |
| Trace events     |            50,000 | `E_TRACE_LIMIT`        |
| Export bytes     |             5 MiB | `E_OUTPUT_LIMIT`       |
| Recursion        | prohibited in 0.3 | `E_RECURSION_DISABLED` |

Generated code is never evaluated. The runtime receives no filesystem, process, credential, or network capability. User source and observation exports are not committed by default.

## 12. Verification matrix

| Gate          | Evidence required             | Pass condition                                    |
| ------------- | ----------------------------- | ------------------------------------------------- |
| Contract      | schema validation + typecheck | all fixtures valid; invalid fixtures fail closed  |
| State         | unit + property tests         | 23 registers; bounds and immutability always hold |
| Paths         | coverage test                 | 22 unique letters and 22 valid routes             |
| Determinism   | golden replay test            | 100 repeated runs produce identical bytes         |
| Separation    | mutation guard test           | coherence on/off yields identical classical state |
| Trace         | hash-chain test               | no sequence gaps or hash discontinuities          |
| Observation   | projection tests              | one stable selection and immutable snapshot       |
| Security      | malformed/fuzz corpus         | no code execution, hangs, or unbounded output     |
| Accessibility | keyboard + automated audit    | WCAG 2.2 AA target; reduced motion honored        |
| Responsive UI | visual checks                 | no overflow at 375, 768, 1280, and 1440 px        |

No release advances with a skipped deterministic, contract, or security gate.

## 13. Repository target

```text
apps/
  architecture-atlas/        # public architecture and specification
  living-tree-console/       # executable trace explorer
  ivritcode-observatory/     # language laboratory
package.json                  # exact canonical package release assets
  @ivritcode/core             # deterministic register engine
  @qec/core                   # orchestration and execution contracts
  @qec/spec                   # schemas, path maps, and trace contracts
specifications/              # schemas and versioned configuration
schematics/                  # repository-native engineering plates
tests/fixtures/              # canonical programs and golden traces
docs/decisions/              # architecture decision records
```

Canonical packages are distributed from the immutable
[`canonical-packages-2026.07.20.1`](https://github.com/Richardatf/IvritCode/releases/tag/canonical-packages-2026.07.20.1)
IvritCode release. `package-lock.json` records the resolved assets and integrity
hashes, so CI and local builds install the same engine and contracts without a
Git submodule.

## 14. Delivery plan

| Phase             | Output                                                 | Exit criterion                      |
| ----------------- | ------------------------------------------------------ | ----------------------------------- |
| 0. Atlas          | public model and boundaries                            | complete                            |
| 1. Vertical slice | executable `אור`, seed lab, gates, observation, export | complete                            |
| 2. Contracts      | shared types, JSON schemas, canonical serializer       | all apps consume one package        |
| 3. Full language  | 22-path map and instruction registry                   | complete; path coverage gate passes |
| 4. Kernel         | service dispatch, policies, limits, event store        | replay and failure atomicity pass   |
| 5. Observatory    | arbitrary valid programs, trace/gate exploration       | keyboard and responsive gates pass  |
| 6. Hardening      | fuzzing, property tests, accessibility, CI release     | all verification gates enforced     |

## 15. Immediate implementation backlog

1. Add golden complete-trace fixtures for canonical seed 09 and at least four alternate seeds.
2. Add failure-atomicity, malformed Unicode, and resource-limit property tests.
3. Add downloadable comparison reports for reproducible review artifacts.
4. Enforce accessibility and responsive-layout audits as release gates.
5. Publish signed package provenance, immutable artifact digests, and engine-contract versions with each release.

## 16. Definition of done

Kernel 0.3 is done when both public experiences consume the same versioned engine; all 22 instructions compile and resolve; the machine is deterministic and bounded; every visual or symbolic claim cites a trace event or explicit convention; observation and manifestation exports validate against published schemas; classical results do not depend on coherence visualization; and every verification gate runs in CI.
