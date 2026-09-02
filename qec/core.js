(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.QECCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "0.1.0";
  const LETTERS = Object.freeze([
    ["א","Aleph"],["ב","Bet"],["ג","Gimel"],["ד","Dalet"],["ה","Hei"],["ו","Vav"],
    ["ז","Zayin"],["ח","Chet"],["ט","Tet"],["י","Yod"],["כ","Kaf"],["ל","Lamed"],
    ["מ","Mem"],["נ","Nun"],["ס","Samekh"],["ע","Ayin"],["פ","Pe"],["צ","Tsadi"],
    ["ק","Qof"],["ר","Resh"],["ש","Shin"],["ת","Tav"]
  ].map(([letter,name],index)=>Object.freeze({index,letter,name})));

  const STAGES = Object.freeze([
    "keter","chokhmah","binah","daat","chesed","gevurah",
    "tiferet","netzach","hod","yesod","malkhut"
  ]);

  const stableStringify = value => {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
    return "{" + Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+stableStringify(value[k])).join(",") + "}";
  };

  function hash(input) {
    const text=typeof input==="string"?input:stableStringify(input);
    let h=2166136261;
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
    return "fnv1a32:"+((h>>>0).toString(16).padStart(8,"0"));
  }

  function buildGateRegistry() {
    const gates=[];
    for(let i=0;i<LETTERS.length;i++) for(let j=i+1;j<LETTERS.length;j++){
      const left=LETTERS[i],right=LETTERS[j];
      gates.push(Object.freeze({
        schemaVersion:VERSION,id:`gate-${left.index+1}-${right.index+1}`,
        letters:left.letter+right.letter,names:left.name+" "+right.name,
        left:left.letter,right:right.letter,status:"unassigned",executable:false
      }));
    }
    return Object.freeze(gates);
  }
  const GATES=buildGateRegistry();

  function createManifest(program, options={}) {
    if(typeof program!=="string"||!program.trim()) throw new Error("Program must be non-empty text");
    const manifest={
      schemaVersion:VERSION,program:program.normalize("NFC"),
      capabilities:Object.freeze([...(options.capabilities||[])]),
      budget:Object.freeze({steps:options.steps||32}),
      alephOlam:Object.freeze({enabled:false,capabilityGrant:false})
    };
    return Object.freeze({...manifest,contentHash:hash(manifest)});
  }

  function tokenize(source) {
    const normalized=source.normalize("NFD").trim();
    const match=normalized.match(/^([\u05D0-\u05EA])([\u0591-\u05C7]*)\s+(\$[A-Za-z][\w]*)\s*,\s*(-?\d+)$/u);
    if(!match) throw new SyntaxError("Expected: <Hebrew opcode+modifier> $register, integer");
    return Object.freeze([
      Object.freeze({type:"opcode",value:match[1]}),
      Object.freeze({type:"modifier",value:match[2].normalize("NFC")}),
      Object.freeze({type:"register",value:match[3]}),
      Object.freeze({type:"integer",value:Number(match[4])})
    ]);
  }

  function compile(tokens) {
    const [opcode,modifier,register,integer]=tokens;
    if(opcode.value!=="י") throw new Error("v0.1 implements only Yod as the integer-operation opcode");
    if(!modifier.value) throw new Error("Yod requires a niqqud modifier");
    return Object.freeze({
      schemaVersion:VERSION,type:"IntegerAdd",
      target:register.value,operand:integer.value,
      source:Object.freeze({opcode:opcode.value,modifier:modifier.value}),
      contentHash:hash(tokens)
    });
  }

  function execute(program, initialState={}, options={}) {
    const manifest=createManifest(program,options),events=[];
    const emit=(stage,status,data={})=>events.push(Object.freeze({
      sequence:events.length+1,stage,status,data:Object.freeze(data)
    }));
    emit("keter","accepted",{manifestHash:manifest.contentHash});
    let tokens,ir,state={...initialState};
    try{
      emit("chokhmah","candidate",{interpretation:"IvritCode instruction"});
      tokens=tokenize(manifest.program);
      emit("binah","validated",{tokenCount:tokens.length});
      emit("daat","verified",{sourceHash:hash(manifest.program),provenance:"user-input"});
      emit("chesed","skipped",{reason:"no retrieval capability requested"});
      emit("gevurah","allowed",{capabilities:manifest.capabilities,budget:manifest.budget});
      emit("tiferet","integrated",{instructionCount:1});
      emit("netzach","local",{distributed:false});
      ir=compile(tokens);
      emit("hod","compiled",{irType:ir.type,irHash:ir.contentHash});
      const before=Number(state[ir.target]||0);
      state[ir.target]=Math.trunc(before)+ir.operand;
      emit("yesod","recorded",{before,after:state[ir.target],stateHash:hash(state)});
      emit("malkhut","resolved",{result:state[ir.target],register:ir.target});
      return Object.freeze({ok:true,manifest,tokens,ir,state:Object.freeze(state),events:Object.freeze(events),traceHash:hash(events)});
    }catch(error){
      emit("malkhut","denied",{name:error.name,message:error.message});
      return Object.freeze({ok:false,manifest,state:Object.freeze(state),events:Object.freeze(events),error:Object.freeze({name:error.name,message:error.message}),traceHash:hash(events)});
    }
  }

  return Object.freeze({VERSION,LETTERS,STAGES,GATES,stableStringify,hash,buildGateRegistry,createManifest,tokenize,compile,execute});
});
