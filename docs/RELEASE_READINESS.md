# QEC release readiness

## Automated release candidate

Run the complete local gate with:

```bash
npm ci
npm run release:check
```

The release gate verifies that one canonical source crosses the published
`@qec/ivrit-compiler` boundary, produces the same normalized opcode stream in
the deterministic QEC runtime, and remains bound to one Run Passport through:

1. the complete trace and manifestation;
2. the `ivritcode-openqasm-0.1` emit-only projection;
3. monotonic, transport-bounded `qec-panel-link-0.1` state frames;
4. simulated QEC-1P `READY` and `APPLIED` acknowledgements;
5. acceptance evidence, JSON Schema validation, serialization, and parsing;
6. a second execution with an identical Run Passport.

The test is `tests/ivritcode-machine-bridge.test.ts`. CI runs the same
`release:check` command on every push and pull request.

The Gate portion of that release check also replays every approved directional
rule from the evidence program, seed, and Gate index declared in
`qec-gate-rules-0.1`. At this milestone, 22 directional approvals are replayed from eight
compiler-verified evidence programs: `אור` seed 09, `שלום` normalized to `שלומ`
seed 17, `בראשית` seed 05, `אמת` seed 07, `אחד` seed 11, `חיים` normalized to
`חיימ` seed 13, `דעת` seed 19, and `מלכות` seed 21. The remaining 440
directional Gates stay reserved and non-executable; repeated-letter reinforcement
remains a self-transition outside the 231-Gate registry.

## Boundaries that remain physical or external

Passing the automated gate makes the software workflow a release candidate. It
does not complete QEC-1P physical Gate 1. The final panel and key subplate stay
blocked until a real prototype passes map, handshake, state, brightness, and
watchdog checks and its acknowledgements are saved in the same Run Passport.

The OpenQASM artifact is checked against the project's versioned mapping and
Run Passport schema, but remains emit-only. Acceptance, transpilation, or
execution by a named independent OpenQASM parser, simulator, or laboratory
backend requires separate backend-specific evidence.
