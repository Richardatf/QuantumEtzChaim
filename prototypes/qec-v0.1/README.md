# QEC v0.1 vertical slice

This directory preserves the first working Quantum Etz Chaim vertical slice originally prepared in commit `5aa2074` for the LuminaNexus site.

It includes:

- the canonical 22-letter Hebrew alphabet and all 231 unique unordered gates
- an IvritCode tokenizer and compiler for the acceptance instruction `יִ $r1, 5`
- a typed execution manifest and deterministic Keter-to-Malkhut trace
- an interactive sefirotic runtime map and searchable gate registry
- six Node.js tests covering gate completeness, deterministic replay, state, Aleph Olam lockout, and auditable denial

The repository's current v0.3 engine remains authoritative. This v0.1 slice is retained as a historical, runnable prototype.

Run its tests from the repository root:

```sh
node --test prototypes/qec-v0.1/test/qec-core.test.js
```

The HTML was designed for the LuminaNexus stylesheet shell and is preserved without overwriting the current QEC interface.
