(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QECCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "0.1.0";
  const GATE_RULE_PROFILE = "qec-gate-rules-0.1";
  const GATE_EVIDENCE_PROGRAMS = Object.freeze([
    Object.freeze({
      id: "or-seed-09",
      profile: "ivritcode-qec-bridge-0.1",
      source: "אור",
      normalizedProgram: "אור",
      seed: 9,
    }),
    Object.freeze({
      id: "shalom-seed-17",
      profile: "ivritcode-qec-bridge-0.1",
      source: "שלום",
      normalizedProgram: "שלומ",
      seed: 17,
    }),
    Object.freeze({
      id: "bereshit-seed-05",
      profile: "ivritcode-qec-bridge-0.1",
      source: "בראשית",
      normalizedProgram: "בראשית",
      seed: 5,
    }),
    Object.freeze({
      id: "emet-seed-07",
      profile: "ivritcode-qec-bridge-0.1",
      source: "אמת",
      normalizedProgram: "אמת",
      seed: 7,
    }),
    Object.freeze({
      id: "echad-seed-11",
      profile: "ivritcode-qec-bridge-0.1",
      source: "אחד",
      normalizedProgram: "אחד",
      seed: 11,
    }),
    Object.freeze({
      id: "chayim-seed-13",
      profile: "ivritcode-qec-bridge-0.1",
      source: "חיים",
      normalizedProgram: "חיימ",
      seed: 13,
    }),
    Object.freeze({
      id: "daat-seed-19",
      profile: "ivritcode-qec-bridge-0.1",
      source: "דעת",
      normalizedProgram: "דעת",
      seed: 19,
    }),
    Object.freeze({
      id: "malkhut-seed-21",
      profile: "ivritcode-qec-bridge-0.1",
      source: "מלכות",
      normalizedProgram: "מלכות",
      seed: 21,
    }),
  ]);
  const LETTERS = Object.freeze(
    [
      ["א", "Aleph"],
      ["ב", "Bet"],
      ["ג", "Gimel"],
      ["ד", "Dalet"],
      ["ה", "Hei"],
      ["ו", "Vav"],
      ["ז", "Zayin"],
      ["ח", "Chet"],
      ["ט", "Tet"],
      ["י", "Yod"],
      ["כ", "Kaf"],
      ["ל", "Lamed"],
      ["מ", "Mem"],
      ["נ", "Nun"],
      ["ס", "Samekh"],
      ["ע", "Ayin"],
      ["פ", "Pe"],
      ["צ", "Tsadi"],
      ["ק", "Qof"],
      ["ר", "Resh"],
      ["ש", "Shin"],
      ["ת", "Tav"],
    ].map(([letter, name], index) => Object.freeze({ index, letter, name })),
  );

  const STAGES = Object.freeze([
    "keter",
    "chokhmah",
    "binah",
    "daat",
    "chesed",
    "gevurah",
    "tiferet",
    "netzach",
    "hod",
    "yesod",
    "malkhut",
  ]);

  const stableStringify = (value) => {
    if (value === null || typeof value !== "object")
      return JSON.stringify(value);
    if (Array.isArray(value))
      return "[" + value.map(stableStringify).join(",") + "]";
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + stableStringify(value[k]))
        .join(",") +
      "}"
    );
  };

  function hash(input) {
    const text = typeof input === "string" ? input : stableStringify(input);
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return "fnv1a32:" + (h >>> 0).toString(16).padStart(8, "0");
  }

  const REFERENCE_GATE_RULES = Object.freeze({
    "gate-1-6": Object.freeze({
      status: "approved",
      technicalBasis:
        "Reference rule for the canonical אור acceptance program: Aleph frame followed by Vav exchange.",
      directions: Object.freeze([
        Object.freeze({
          from: "א",
          to: "ו",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "or-seed-09",
            gateIndex: 0,
          }),
        }),
        Object.freeze({
          from: "ו",
          to: "א",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-1-8": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified אחד bridge run at seed 11: א followed by ח; observed crossing topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "א",
          to: "ח",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "echad-seed-11",
            gateIndex: 0,
          }),
        }),
        Object.freeze({
          from: "ח",
          to: "א",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-1-13": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified אמת bridge run at seed 7: א followed by מ; observed continuation topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "א",
          to: "מ",
          status: "approved",
          executable: true,
          composition: "continuation",
          evidence: Object.freeze({
            programId: "emet-seed-07",
            gateIndex: 0,
          }),
        }),
        Object.freeze({
          from: "מ",
          to: "א",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-1-20": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified בראשית bridge run at seed 5: ר followed by א; observed crossing topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "א",
          to: "ר",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
        Object.freeze({
          from: "ר",
          to: "א",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "bereshit-seed-05",
            gateIndex: 1,
          }),
        }),
      ]),
    }),
    "gate-1-21": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified בראשית bridge run at seed 5: א followed by ש; observed continuation topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "א",
          to: "ש",
          status: "approved",
          executable: true,
          composition: "continuation",
          evidence: Object.freeze({
            programId: "bereshit-seed-05",
            gateIndex: 2,
          }),
        }),
        Object.freeze({
          from: "ש",
          to: "א",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-2-20": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified בראשית bridge run at seed 5: ב followed by ר; observed crossing topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "ב",
          to: "ר",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "bereshit-seed-05",
            gateIndex: 0,
          }),
        }),
        Object.freeze({
          from: "ר",
          to: "ב",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-4-8": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified אחד bridge run at seed 11: ח followed by ד; observed crossing topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "ד",
          to: "ח",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
        Object.freeze({
          from: "ח",
          to: "ד",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "echad-seed-11",
            gateIndex: 1,
          }),
        }),
      ]),
    }),
    "gate-4-16": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified דעת bridge run at seed 19: ד followed by ע; observed crossing topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "ד",
          to: "ע",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "daat-seed-19",
            gateIndex: 0,
          }),
        }),
        Object.freeze({
          from: "ע",
          to: "ד",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-6-11": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified מלכות bridge run at seed 21: כ followed by ו; observed crossing topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "ו",
          to: "כ",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
        Object.freeze({
          from: "כ",
          to: "ו",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "malkhut-seed-21",
            gateIndex: 2,
          }),
        }),
      ]),
    }),
    "gate-6-12": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified שלום bridge run: Lamed understanding rotation followed by Vav exchange.",
      directions: Object.freeze([
        Object.freeze({
          from: "ו",
          to: "ל",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
        Object.freeze({
          from: "ל",
          to: "ו",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "shalom-seed-17",
            gateIndex: 1,
          }),
        }),
      ]),
    }),
    "gate-6-13": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified שלום bridge run: Vav exchange followed by Mem endurance flow.",
      directions: Object.freeze([
        Object.freeze({
          from: "ו",
          to: "מ",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "shalom-seed-17",
            gateIndex: 2,
          }),
        }),
        Object.freeze({
          from: "מ",
          to: "ו",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-6-20": Object.freeze({
      status: "approved",
      technicalBasis:
        "Reference rule for the canonical אור acceptance program: Vav exchange followed by Resh reseed.",
      directions: Object.freeze([
        Object.freeze({
          from: "ו",
          to: "ר",
          status: "approved",
          executable: true,
          composition: "continuation",
          evidence: Object.freeze({
            programId: "or-seed-09",
            gateIndex: 1,
          }),
        }),
        Object.freeze({
          from: "ר",
          to: "ו",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-6-22": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified מלכות bridge run at seed 21: ו followed by ת; observed continuation topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "ו",
          to: "ת",
          status: "approved",
          executable: true,
          composition: "continuation",
          evidence: Object.freeze({
            programId: "malkhut-seed-21",
            gateIndex: 3,
          }),
        }),
        Object.freeze({
          from: "ת",
          to: "ו",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-8-10": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified חיים bridge run at seed 13: ח followed by י; observed continuation topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "ח",
          to: "י",
          status: "approved",
          executable: true,
          composition: "continuation",
          evidence: Object.freeze({
            programId: "chayim-seed-13",
            gateIndex: 0,
          }),
        }),
        Object.freeze({
          from: "י",
          to: "ח",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-10-13": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified חיים bridge run at seed 13: י followed by מ; observed continuation topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "י",
          to: "מ",
          status: "approved",
          executable: true,
          composition: "continuation",
          evidence: Object.freeze({
            programId: "chayim-seed-13",
            gateIndex: 2,
          }),
        }),
        Object.freeze({
          from: "מ",
          to: "י",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-10-21": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified בראשית bridge run at seed 5: ש followed by י; observed continuation topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "י",
          to: "ש",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
        Object.freeze({
          from: "ש",
          to: "י",
          status: "approved",
          executable: true,
          composition: "continuation",
          evidence: Object.freeze({
            programId: "bereshit-seed-05",
            gateIndex: 3,
          }),
        }),
      ]),
    }),
    "gate-10-22": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified בראשית bridge run at seed 5: י followed by ת; observed crossing topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "י",
          to: "ת",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "bereshit-seed-05",
            gateIndex: 4,
          }),
        }),
        Object.freeze({
          from: "ת",
          to: "י",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-11-12": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified מלכות bridge run at seed 21: ל followed by כ; observed crossing topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "כ",
          to: "ל",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
        Object.freeze({
          from: "ל",
          to: "כ",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "malkhut-seed-21",
            gateIndex: 1,
          }),
        }),
      ]),
    }),
    "gate-12-13": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified מלכות bridge run at seed 21: מ followed by ל; observed continuation topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "ל",
          to: "מ",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
        Object.freeze({
          from: "מ",
          to: "ל",
          status: "approved",
          executable: true,
          composition: "continuation",
          evidence: Object.freeze({
            programId: "malkhut-seed-21",
            gateIndex: 0,
          }),
        }),
      ]),
    }),
    "gate-12-21": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified שלום bridge run: Shin center descent followed by Lamed understanding rotation.",
      directions: Object.freeze([
        Object.freeze({
          from: "ל",
          to: "ש",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
        Object.freeze({
          from: "ש",
          to: "ל",
          status: "approved",
          executable: true,
          composition: "continuation",
          evidence: Object.freeze({
            programId: "shalom-seed-17",
            gateIndex: 0,
          }),
        }),
      ]),
    }),
    "gate-13-22": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified אמת bridge run at seed 7: מ followed by ת; observed crossing topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "מ",
          to: "ת",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "emet-seed-07",
            gateIndex: 1,
          }),
        }),
        Object.freeze({
          from: "ת",
          to: "מ",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
    "gate-16-22": Object.freeze({
      status: "approved",
      technicalBasis:
        "Compiler-verified דעת bridge run at seed 19: ע followed by ת; observed crossing topology.",
      directions: Object.freeze([
        Object.freeze({
          from: "ע",
          to: "ת",
          status: "approved",
          executable: true,
          composition: "crossing",
          evidence: Object.freeze({
            programId: "daat-seed-19",
            gateIndex: 1,
          }),
        }),
        Object.freeze({
          from: "ת",
          to: "ע",
          status: "reserved",
          executable: false,
          composition: null,
          evidence: null,
        }),
      ]),
    }),
  });

  function buildGateRegistry() {
    const gates = [];
    for (let i = 0; i < LETTERS.length; i++)
      for (let j = i + 1; j < LETTERS.length; j++) {
        const left = LETTERS[i],
          right = LETTERS[j];
        const id = `gate-${left.index + 1}-${right.index + 1}`,
          rule = REFERENCE_GATE_RULES[id];
        gates.push(
          Object.freeze({
            schemaVersion: VERSION,
            ruleProfile: GATE_RULE_PROFILE,
            id,
            letters: left.letter + right.letter,
            names: left.name + " " + right.name,
            left: left.letter,
            right: right.letter,
            status: rule?.status ?? "reserved",
            executable:
              rule?.directions.some((direction) => direction.executable) ??
              false,
            technicalBasis:
              rule?.technicalBasis ??
              "Reserved until its directional rule is explicitly reviewed.",
            directions: rule?.directions ?? Object.freeze([]),
          }),
        );
      }
    return Object.freeze(gates);
  }
  const GATES = buildGateRegistry();

  function createManifest(program, options = {}) {
    if (typeof program !== "string" || !program.trim())
      throw new Error("Program must be non-empty text");
    const capabilities = [...(options.capabilities || [])];
    const steps = options.steps ?? 32;
    if (
      !capabilities.every(
        (capability) => typeof capability === "string" && capability.trim(),
      )
    )
      throw new TypeError("Capabilities must be non-empty strings");
    if (new Set(capabilities).size !== capabilities.length)
      throw new Error("Capabilities must be unique");
    if (!Number.isInteger(steps) || steps < 1 || steps > 10000)
      throw new RangeError("Step budget must be an integer from 1 to 10000");
    const manifest = {
      schemaVersion: VERSION,
      program: program.normalize("NFC"),
      capabilities: Object.freeze(capabilities),
      budget: Object.freeze({ steps }),
      alephOlam: Object.freeze({ enabled: false, capabilityGrant: false }),
    };
    return Object.freeze({ ...manifest, contentHash: hash(manifest) });
  }

  function tokenize(source) {
    const normalized = source.normalize("NFD").trim();
    const match = normalized.match(
      /^([\u05D0-\u05EA])([\u0591-\u05C7]*)\s+(\$[A-Za-z][\w]*)\s*,\s*(-?\d+)$/u,
    );
    if (!match)
      throw new SyntaxError(
        "Expected: <Hebrew opcode+modifier> $register, integer",
      );
    return Object.freeze([
      Object.freeze({ type: "opcode", value: match[1] }),
      Object.freeze({ type: "modifier", value: match[2].normalize("NFC") }),
      Object.freeze({ type: "register", value: match[3] }),
      Object.freeze({ type: "integer", value: Number(match[4]) }),
    ]);
  }

  function compile(tokens) {
    const [opcode, modifier, register, integer] = tokens;
    if (opcode.value !== "י")
      throw new Error(
        "v0.1 implements only Yod as the integer-operation opcode",
      );
    if (!modifier.value) throw new Error("Yod requires a niqqud modifier");
    return Object.freeze({
      schemaVersion: VERSION,
      type: "IntegerAdd",
      target: register.value,
      operand: integer.value,
      source: Object.freeze({ opcode: opcode.value, modifier: modifier.value }),
      contentHash: hash(tokens),
    });
  }

  function execute(program, initialState = {}, options = {}) {
    const manifest = createManifest(program, options),
      events = [];
    const emit = (stage, status, data = {}) =>
      events.push(
        Object.freeze({
          sequence: events.length + 1,
          stage,
          status,
          data: Object.freeze(data),
        }),
      );
    emit("keter", "accepted", { manifestHash: manifest.contentHash });
    let tokens,
      ir,
      state = { ...initialState };
    try {
      emit("chokhmah", "candidate", {
        interpretation: "IvritCode instruction",
      });
      tokens = tokenize(manifest.program);
      emit("binah", "validated", { tokenCount: tokens.length });
      emit("daat", "verified", {
        sourceHash: hash(manifest.program),
        provenance: "user-input",
      });
      emit("chesed", "skipped", {
        reason: "no retrieval capability requested",
      });
      emit("gevurah", "allowed", {
        capabilities: manifest.capabilities,
        budget: manifest.budget,
      });
      emit("tiferet", "integrated", { instructionCount: 1 });
      emit("netzach", "local", { distributed: false });
      ir = compile(tokens);
      emit("hod", "compiled", { irType: ir.type, irHash: ir.contentHash });
      const before = Number(state[ir.target] || 0);
      state[ir.target] = Math.trunc(before) + ir.operand;
      emit("yesod", "recorded", {
        before,
        after: state[ir.target],
        stateHash: hash(state),
      });
      emit("malkhut", "resolved", {
        result: state[ir.target],
        register: ir.target,
      });
      return Object.freeze({
        ok: true,
        manifest,
        tokens,
        ir,
        state: Object.freeze(state),
        events: Object.freeze(events),
        traceHash: hash(events),
      });
    } catch (error) {
      emit("malkhut", "denied", { name: error.name, message: error.message });
      return Object.freeze({
        ok: false,
        manifest,
        state: Object.freeze(state),
        events: Object.freeze(events),
        error: Object.freeze({ name: error.name, message: error.message }),
        traceHash: hash(events),
      });
    }
  }

  return Object.freeze({
    VERSION,
    GATE_RULE_PROFILE,
    GATE_EVIDENCE_PROGRAMS,
    LETTERS,
    STAGES,
    GATES,
    stableStringify,
    hash,
    buildGateRegistry,
    createManifest,
    tokenize,
    compile,
    execute,
  });
});
