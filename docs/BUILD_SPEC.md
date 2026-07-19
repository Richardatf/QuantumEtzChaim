# Quantum Etz Chaim / IvritOS Build Specification

Version: 0.2  
Status: architecture baseline  
Updated: 2026-07-18

## 1. Purpose

Quantum Etz Chaim is the architecture atlas for an experimental symbolic-computing system. IvritOS coordinates the architecture. IvritCode is its deterministic Hebrew-letter instruction language. The IvritCode Observatory is the execution and visualization environment.

This specification defines a software simulation. It is not a physical quantum computer, a proof of Kabbalah, prophecy, or religious authority.

## 2. System boundaries

The implementation has two connected planes:

- **Letter Plane:** 22 visible Hebrew-letter registers plus one hidden Aleph Olam register. This is the deterministic computational microstate.
- **Sefirotic Plane:** eleven named service regions, including Da’at as an event boundary rather than an ordinary persistent register.

Both planes share an immutable execution context, gate history, path history, and observation history. The classical engine must run independently of the optional coherence visualization.

## 3. Logical architecture

| Region   | Service            | Build responsibility                                    |
| -------- | ------------------ | ------------------------------------------------------- |
| Keter    | `KeterService`     | Program identity, intent, seed, uncommitted candidates  |
| Chokhmah | `ChokhmahService`  | Candidate generation and instruction impulse            |
| Binah    | `BinahCompiler`    | Unicode parsing, compilation, structural validation     |
| Da’at    | `DaatObserver`     | Checkpoints, deterministic observation, trace snapshots |
| Chesed   | `ChesedAllocator`  | Allocation, expansion, duplication, resource grants     |
| Gevurah  | `GevurahPolicy`    | Permissions, limits, sandboxing, typed failures         |
| Tiferet  | `TiferetScheduler` | Scheduling, reconciliation, coherence evaluation        |
| Netzach  | `NetzachRuntime`   | Iteration, retries, persistence, continuation           |
| Hod      | `HodInterface`     | Diagnostics, serialization, explanation, disassembly    |
| Yesod    | `YesodBus`         | Shared state, synchronization, cache, execution history |
| Malchut  | `MalchutOutput`    | Visible, audible, and exported results                  |

## 4. Required state model

```ts
interface UnifiedMachineState {
  letterPlane: IvritState; // exactly 23 registers
  sefiroticPlane: SefiroticState; // exactly 11 named regions
  alephOlam: AlephOlamContext;
  execution: ExecutionContext;
  gateHistory: readonly GateEvent[];
  pathHistory: readonly ExecutionPathEvent[];
  observationHistory: readonly ObservationEvent[];
}

interface AlephOlamContext {
  numericValue: Base22Digit;
  programIntent: string;
  programHash: string;
  executionSeed: number;
  permissions: ReadonlySet<Permission>;
  currentPhase: number;
  coherenceTarget: number;
  activePath?: HebrewLetter;
  systemMode: "classical" | "coherence";
  metadata: Readonly<Record<string, unknown>>;
}
```

Aleph Olam supplies a common orientation. It must never copy one value into every visible register.

## 5. Instruction lifecycle

1. Binah normalizes Unicode and parses letters and marks.
2. Gevurah validates the operation, permissions, and resource limits.
3. Keter supplies immutable intent and Aleph Olam context.
4. The instruction activates its versioned architectural path.
5. Source and destination services execute.
6. The deterministic Letter Plane transform runs.
7. Yesod synchronizes histories and both planes.
8. Tiferet evaluates consistency and optional simulated coherence.
9. Da’at records an observation when required.
10. Malchut renders or exports the observed result.

## 6. Repository target

```text
apps/
  quantum-etz-chaim/
  ivritcode-observatory/
packages/
  qec-architecture/
  ivritos-kernel/
  ivritcode-language/
  ivritcode-runtime/
  unicode-hebrew/
  gates-231/
  resonance/
  shared-ui/
specifications/
schematics/
docs/
```

The current repository is the static Architecture Atlas and specification seed. Runtime packages are the next implementation phase.

## 7. Determinism and coherence

- Identical program, initial state, configuration, and seed must produce byte-equivalent trace data.
- No wall-clock randomness may affect execution.
- Classical mode never depends on activation, phase, or coherence values.
- Coherence mode derives `activation ∈ [0,1]`, `phase ∈ [0,2π]`, and `coherence ∈ [0,1]` from deterministic state.
- Public UI must label coherence mode: **A theoretical visualization—not physical quantum computation.**

## 8. Data contracts

- The 22-path map is editable, versioned, and explicitly labeled as a project convention.
- Every instruction references one valid path and one deterministic Letter Plane transform.
- Adjacent letters generate a gate event from computed path relationships.
- Recognized but unsupported niqqud or cantillation is preserved and reported.
- Symbolic descriptions must cite the computed event that supports them.

## 9. Security and safety

- Parse input by Unicode grapheme cluster and normalize with NFC.
- Apply explicit execution-step, memory, recursion, and output limits.
- Keep permissions immutable during a run unless a signed transition event changes them.
- Never execute generated code outside the typed instruction runtime.
- Never commit secrets, private keys, user prompts, or observation exports by default.

## 10. Verification gates

- Exactly 22 visible and one hidden Letter Plane registers.
- Exactly eleven named Sefirotic regions.
- Complete, valid, versioned path coverage for all Hebrew instructions.
- Reproducible execution, gate composition, coherence, and observation.
- Classical/coherence separation tests.
- Bounds tests for all simulated values.
- Accessible keyboard operation and reduced-motion support.
- Responsive checks at 375, 768, 1280, and 1440 CSS pixels.
- Link, HTML, type, lint, unit, integration, and deterministic snapshot tests.

## 11. Delivery phases

1. **Atlas baseline — implemented:** research-grounded public architecture, interactive Tree, visual system, schematics, and specification.
2. **Shared contracts — next:** TypeScript types, path-map schema, Unicode parser, deterministic state fixtures.
3. **Runtime kernel:** service graph, Letter Plane adapter, execution tracing, gates.
4. **Coherence and observation:** seeded simulation, Da’at checkpoints, Malchut render contracts.
5. **Living Tree Console:** step runner, Tree illumination, letter constellation, gate explorer.
6. **Hardening:** property tests, accessibility audit, versioned documentation, deployment pipeline.

## 12. Definition of done

The system is complete when both public sites consume the same typed engine and versioned configuration; all machine state is reproducible; every visual claim is traceable to real events; simulation and physical quantum computation are never conflated; and the full verification suite passes without secrets.
