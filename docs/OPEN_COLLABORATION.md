# Quantum Etz Chaim open collaboration policy

Quantum Etz Chaim is intended to be inspectable, reproducible, forkable, and useful outside the original repository.

## Permission is not part of the protocol

The QEC contracts define data shapes, version boundaries, validation rules, and evidence requirements. They are technical interoperability contracts, not access controls or permission gates.

Under the repository's MIT License, people may freely use, copy, modify, fork, publish, redistribute, sublicense, and commercially use the material in this repository subject to the license terms.

That includes the public source code, OpenQASM projection profiles, JSON Schemas, examples, validation scripts, captured public evidence, documentation, firmware, and published hardware-reference material.

## Independent implementations are welcome

You do not need permission from the QEC project to:

- implement an IvritCode-to-OpenQASM profile;
- write a compatible or competing parser, compiler, runtime, simulator, or visualizer;
- test QEC output against additional OpenQASM toolchains;
- propose or publish alternative Hebrew-letter mappings;
- build from the published QEC-1/QEC-1P reference material;
- create a fork with different Gate rules, hardware, or execution semantics;
- publish validation failures or disagreements with QEC's design;
- use the public interfaces in research, education, commercial work, or independent experimentation.

## What versioning still means

Openness does not remove the need for precise versioning. A result should identify the exact profile, source, validator, hardware contract, or evidence record it used. A fork may change anything, but it should change its identifiers when compatibility with the original contract no longer holds.

The current QEC Run Passport continues to preserve exact provenance because reproducibility depends on knowing what actually ran. The Passport is evidence plumbing, not a licensing mechanism.

## OpenQASM collaboration

QEC's OpenQASM work is published specifically so outside experts can inspect it, break it, extend it, or replace weak ideas. Passing one validator does not reserve a design space for QEC, and QEC does not require derivative OpenQASM experiments to return changes upstream.

Contributions back to QEC are welcome, but forking is equally legitimate.

## Scientific and affiliation boundary

Open licensing does not imply that OpenQASM, Qiskit, a laboratory, or another project endorses QEC. Likewise, an OpenQASM parser or simulator accepting QEC output is compatibility evidence for that tool/version and corpus, not proof of quantum-hardware execution.

## License

See the repository root [`LICENSE`](../LICENSE). The repository is released under the MIT License.
