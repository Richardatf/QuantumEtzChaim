const test=require("node:test");
const assert=require("node:assert/strict");
const QEC=require("../qec/core.js");

test("canonical alphabet contains 22 unique Hebrew letters",()=>{
  assert.equal(QEC.LETTERS.length,22);
  assert.equal(new Set(QEC.LETTERS.map(x=>x.letter)).size,22);
});

test("registry contains exactly 231 unique unordered, non-executable gates",()=>{
  assert.equal(QEC.GATES.length,231);
  assert.equal(new Set(QEC.GATES.map(x=>x.id)).size,231);
  assert.ok(QEC.GATES.every(x=>x.left!==x.right&&x.status==="unassigned"&&!x.executable));
});

test("acceptance program compiles and resolves deterministically",()=>{
  const first=QEC.execute("יִ $r1, 5");
  const second=QEC.execute("יִ $r1, 5");
  assert.equal(first.ok,true);
  assert.equal(first.state.$r1,5);
  assert.equal(first.ir.type,"IntegerAdd");
  assert.deepEqual(first.events.map(e=>e.stage),QEC.STAGES);
  assert.equal(first.traceHash,second.traceHash);
});

test("initial register state participates in execution",()=>{
  const result=QEC.execute("יִ $r1, 5",{$r1:7});
  assert.equal(result.state.$r1,12);
});

test("Aleph Olam remains disabled and grants no capability",()=>{
  const manifest=QEC.createManifest("יִ $r1, 5");
  assert.deepEqual(manifest.alephOlam,{enabled:false,capabilityGrant:false});
});

test("unknown opcode is denied with an auditable terminal event",()=>{
  const result=QEC.execute("אִ $r1, 5");
  assert.equal(result.ok,false);
  assert.equal(result.events.at(-1).stage,"malkhut");
  assert.equal(result.events.at(-1).status,"denied");
});
