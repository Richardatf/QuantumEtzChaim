# Quantum Etz Chaim

The visual Tree companion to [IvritCode](https://ivritcode.org/).

## IvritCode exchange

IvritCode can open this site with a versioned, validated execution snapshot in
the `exchange` query parameter. The Tree deterministically highlights nodes from
the source and returning letters, presents the resulting register metadata, and
provides an **Edit in IvritCode** link that restores the original Hebrew source.

The canonical contract is `ivritcode-exchange-0.2`, defined in the IvritCode
repository at `spec/ivritcode-exchange-0.2.schema.json`. It binds the source and
register states to the engine version, path-map version, seed, complete trace
hash, and manifestation version. Unknown or malformed
data is ignored; it never becomes executable code.

## Architecture package

- Original concept artwork: `assets/images/`
- Repository-native engineering plates: `schematics/`
- [Quantum Etz Chaim / IvritOS v0.2 build specification](docs/BUILD_SPEC.md)
- [Machine-readable architecture contract](specifications/qec-architecture-v0.2.json)
- [Draft 2020-12 contract schemas](specifications/schemas/) for machine state,
  path maps, traces, observations, and manifestation exports
- Executable `אור` vertical slice in `console.html`
- Interactive Gate Explorer with computed routes, shared services, register
  changes, and coherence deltas
- Da’at Observation Inspector with three deterministic candidate projections,
  recorded selection, and immutable snapshot metadata
- Malchut Manifestation Inspector with Hebrew, base-22, path-signature,
  checksum, clipboard, and versioned JSON outputs
- Aleph Olam Seed Lab comparing orientation, register diversity, coherence,
  observation selection, checksum, and output rotation against seed 9
- Versioned `אור` path configuration in
  `specifications/qec-or-paths-v0.1.json`
- Complete 22-letter architecture candidate in
  `specifications/qec-paths-v0.3.json`, protected by a canonical path digest
- Arbitrary-program `runProgram()` engine with 22 registered transforms, final
  letter-form normalization, adjacent gate composition, and deterministic output
- IvritCode Program Lab for running Hebrew source and inspecting normalized
  input, path/gate counts, observation choice, checksum, routes, and failures;
  valid programs load directly into the Tree stepper and v0.2 manifestation export
- Shareable Program Lab permalinks that restore normalized source and seed with
  bounded parsing and safe fallback behavior
- Trace Comparator with a pinnable baseline, common-prefix detection, register
  changes, path/gate deltas, coherence, observation, and checksum differences
- First-divergence inspection with mismatch classification, competing routes and
  transforms, state hashes, and changed register indices

The coherence layer is a deterministic theoretical visualization, not physical
quantum computation. Project-defined symbolic correspondences are architecture
conventions rather than scientific or religious claims.

## Local development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm test
npm run build
```
